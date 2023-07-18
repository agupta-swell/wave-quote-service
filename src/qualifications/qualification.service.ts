/* eslint-disable no-param-reassign */
import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, ObjectId } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { PropertyService } from 'src/property/property.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { OperationResult } from '../app/common';
import { ContactService } from '../contacts/contact.service';
import { EmailService } from '../emails/email.service';
import { OpportunityService } from '../opportunities/opportunity.service';
import { TokenService } from '../tokens/token.service';
import {
  APPLICANT_TYPE,
  APPLICATION_PROCESS_STATUS,
  APPROVAL_MODE,
  CONSENT_STATUS,
  FNI_APPLICATION_STATE,
  FNI_REQUEST_TYPE,
  FNI_RESPONSE_ERROR_MAP,
  FNI_TRANSACTION_STATUS,
  MILESTONE_STATUS,
  PROCESS_STATUS,
  QUALIFICATION_CATEGORY,
  QUALIFICATION_STATUS,
  QUALIFICATION_TYPE,
  ROLE,
  TOKEN_STATUS,
  VENDOR_ID,
} from './constants';
import { IApplicant, IFniApplicationResponse, QualificationCredit, QUALIFICATION_CREDIT, IEventHistory } from './qualification.schema';
import {
  ApplyCreditQualificationReqDto,
  CreateQualificationReqDto,
  GetApplicationDetailReqDto,
  SendMailReqDto,
  SetApplicantConsentReqDto,
  SetManualApprovalReqDto,
  RecieveFniDecisionReqDto,
} from './req';
import { ProcessCreditQualificationReqDto } from './req/process-credit-qualification.dto';
import {
  ApplicantConsentDto,
  GetApplicationDetailDto,
  GetQualificationDetailDto,
  ManualApprovalDto,
  QualificationDetailDto,
  SendMailDto,
} from './res';
import { FniEngineService } from './sub-services/fni-engine.service';
import { IFniApplyReq, IFniResponse, ITokenData } from './typing.d';
import { getQualificationMilestoneAndProcessStatusByVerbalConsent } from './utils';
import { sortByDescending } from 'src/utils/array';

@Injectable()
export class QualificationService {
  private readonly logger = new Logger(QualificationService.name);

  constructor(
    @InjectModel(QUALIFICATION_CREDIT) private readonly qualificationCreditModel: Model<QualificationCredit>,

    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => OpportunityService))
    private readonly opportunityService: OpportunityService,
    @Inject(forwardRef(() => ContactService))
    private readonly contactService: ContactService,
    private readonly propertyService: PropertyService,
    private readonly emailService: EmailService,
    private readonly fniEngineService: FniEngineService,
    private readonly tokenService: TokenService,
  ) { }

  async createQualification(
    qualificationDto: CreateQualificationReqDto,
  ): Promise<OperationResult<QualificationDetailDto>> {
    // TODO: This might have many qualifications
    const found = await this.qualificationCreditModel
      .findOne({ opportunityId: qualificationDto.opportunityId, type: qualificationDto.type })
      .lean();
    if (found) {
      throw ApplicationException.ExistedEntity('opportunityId', qualificationDto.opportunityId);
    }

    const now = new Date();
    const qualificationCategory =
      qualificationDto.type === QUALIFICATION_TYPE.HARD
        ? QUALIFICATION_CATEGORY.HARD_CREDIT
        : QUALIFICATION_CATEGORY.SOFT_CREDIT;
    const model = new this.qualificationCreditModel({
      opportunityId: qualificationDto.opportunityId,
      type: qualificationDto.type,
      startedOn: now,
      milestone: MILESTONE_STATUS.INITIATED,
      processStatus: PROCESS_STATUS.INITIATED,
      eventHistories: [
        {
          issueDate: now,
          by: qualificationDto.agentDetail.name,
          detail: 'Request Initiated',
          userId: qualificationDto.agentDetail.userId,
          qualificationCategory,
        },
      ],
      fniApplications: [
        {
          state: FNI_APPLICATION_STATE.ACTIVE,
        },
      ],
      vendorId: VENDOR_ID.FNI,
    });
    await model.save();

    return OperationResult.ok(strictPlainToClass(QualificationDetailDto, model.toJSON()));
  }

  async getQualificationDetail(opportunityId: string): Promise<OperationResult<GetQualificationDetailDto>> {
    const data = await Promise.all(
      [QUALIFICATION_TYPE.SOFT, QUALIFICATION_TYPE.HARD].map(async type => {
        const qualificationCredit = await this.qualificationCreditModel
          .findOne(
            { opportunityId, type },
            {},
            {
              sort: {
                createdAt: -1,
              },
            },
          )
          .lean();

        if (!qualificationCredit) {
          return {
            type,
            qualificationCreditData: null,
          };
        }

        return {
          type,
          qualificationCreditData: qualificationCredit,
        };
      }),
    );

    return OperationResult.ok(
      strictPlainToClass(GetQualificationDetailDto, {
        opportunityId,
        qualificationData: data,
      }),
    );
  }

  async setManualApproval(
    id: ObjectId,
    manualApprovalDto: SetManualApprovalReqDto,
  ): Promise<OperationResult<ManualApprovalDto>> {
    if (process.env.NODE_ENV === 'production') {
      throw ApplicationException.NoPermission();
    }

    const now = new Date();
    const qualificationCredit = await this.qualificationCreditModel.findById(id);
    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound(id.toString());
    }
    const qualificationCategory =
      qualificationCredit.type === QUALIFICATION_TYPE.HARD
        ? QUALIFICATION_CATEGORY.HARD_CREDIT
        : QUALIFICATION_CATEGORY.SOFT_CREDIT;
    qualificationCredit.milestone = MILESTONE_STATUS.APPLICATION_STATUS;
    qualificationCredit.processStatus = PROCESS_STATUS.COMPLETED;
    qualificationCredit.eventHistories.push({
      issueDate: now,
      by: manualApprovalDto.agentFullName,
      detail: 'Credit Check Approved By Agent',
      userId: manualApprovalDto.agentUserId,
      qualificationCategory,
    });
    qualificationCredit.approvalMode = APPROVAL_MODE.AGENT;
    qualificationCredit.qualificationStatus = QUALIFICATION_STATUS.APPROVED;
    qualificationCredit.approvedBy = manualApprovalDto.agentUserId;

    await qualificationCredit.save();

    return OperationResult.ok(
      strictPlainToClass(ManualApprovalDto, {
        status: true,
        statusDetail: 'SUCCESS',
        qualificationCredit: qualificationCredit.toJSON(),
      }),
    );
  }

  async setApplicantConsent(
    id: ObjectId,
    applicantConsentDto: SetApplicantConsentReqDto,
  ): Promise<OperationResult<ApplicantConsentDto>> {
    const { applicantConsent, opportunityId } = applicantConsentDto;

    const now = new Date();

    if (process.env.NODE_ENV === 'production') {
      throw ApplicationException.NoPermission();
    }

    const [foundOpportunity, qualificationCredit] = await Promise.all([
      this.opportunityService.getDetailById(opportunityId),
      this.qualificationCreditModel.findById(id),
    ]);

    if (!foundOpportunity) {
      throw ApplicationException.EntityNotFound(opportunityId);
    }

    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound(id.toString());
    }

    const oldPropertyHomeowners = await this.propertyService.findHomeownersById(foundOpportunity.propertyId);

    const qualificationCategory =
      qualificationCredit.type === QUALIFICATION_TYPE.HARD
        ? QUALIFICATION_CATEGORY.HARD_CREDIT
        : QUALIFICATION_CATEGORY.SOFT_CREDIT;
    switch (applicantConsent.type) {
      case CONSENT_STATUS.HAS_CO_APPLICANT_CONSENT:
        qualificationCredit.hasCoApplicantConsent = applicantConsent.option;
        if (applicantConsent.option) {
          qualificationCredit.eventHistories.push({
            issueDate: now,
            by: applicantConsentDto.userFullName,
            detail: 'Co-Applicant Consent set to Yes',
            qualificationCategory,
          });
        } else {
          qualificationCredit.eventHistories.push({
            issueDate: now,
            by: applicantConsentDto.userFullName,
            detail: 'Co-Applicant Consent set to No',
            qualificationCategory,
          });
        }
        break;
      case CONSENT_STATUS.HAS_CO_APPLICANT:
        qualificationCredit.hasCoApplicant = applicantConsent.option;
        if (applicantConsent.option) {
          if (applicantConsent.coApplicantContact && oldPropertyHomeowners?.length === 1) {
            await this.contactService.addNewContact({
              propertyId: foundOpportunity.propertyId,
              data: applicantConsent.coApplicantContact,
            });
          }
          qualificationCredit.eventHistories.push({
            issueDate: now,
            by: applicantConsentDto.userFullName,
            detail: 'Has Co-Applicant set to Yes',
            qualificationCategory,
          });
        } else {
          qualificationCredit.eventHistories.push({
            issueDate: now,
            by: applicantConsentDto.userFullName,
            detail: 'Has Co-Applicant set to No',
            qualificationCategory,
          });
          if (qualificationCredit.hasCoApplicantConsent !== undefined) {
            qualificationCredit.hasCoApplicantConsent = undefined;
          }
        }
        break;
      default:
        qualificationCredit.hasApplicantConsent = applicantConsent.option;
        if (applicantConsent.option) {
          qualificationCredit.eventHistories.push({
            issueDate: now,
            by: applicantConsentDto.userFullName,
            detail: 'Applicant consent set to Yes',
            qualificationCategory,
          });
        } else {
          qualificationCredit.eventHistories.push({
            issueDate: now,
            by: applicantConsentDto.userFullName,
            detail: 'Applicant consent set to No',
            qualificationCategory,
          });
        }
        break;
    }

    const { milestone, processStatus } = getQualificationMilestoneAndProcessStatusByVerbalConsent(qualificationCredit);

    qualificationCredit.milestone = milestone;
    qualificationCredit.processStatus = processStatus;

    const [_, newPropertyHomeowners] = await Promise.all([
      qualificationCredit.save(),
      this.propertyService.findHomeownersById(foundOpportunity.propertyId),
    ]);

    return OperationResult.ok(
      strictPlainToClass(ApplicantConsentDto, {
        qualificationCredit: qualificationCredit.toJSON(),
        propertyHomeowners: newPropertyHomeowners,
      }),
    );
  }

  async resendMail(req: SendMailReqDto): Promise<OperationResult<SendMailDto>> {
    const qualificationCredit = await this.qualificationCreditModel.findById(req.qualificationCreditId);
    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound(`qualificationCreditId: ${req.qualificationCreditId}`);
    }

    qualificationCredit.fniApplications.forEach(item => {
      item.state = FNI_APPLICATION_STATE.INACTIVE;
    });
    qualificationCredit.fniApplications.push({
      state: FNI_APPLICATION_STATE.ACTIVE,
      reason: [],
      responses: [],
    });
    return this.qualificationMailHandler(req, qualificationCredit);
  }

  async sendMail(req: SendMailReqDto): Promise<OperationResult<SendMailDto>> {
    const qualificationCredit = await this.qualificationCreditModel.findById(req.qualificationCreditId);
    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound(`qualificationCreditId: ${req.qualificationCreditId}`);
    }

    return this.qualificationMailHandler(req, qualificationCredit);
  }

  async qualificationMailHandler(
    req: SendMailReqDto,
    qualificationCredit: QualificationCredit,
  ): Promise<OperationResult<SendMailDto>> {
    const opportunity = await this.opportunityService.getDetailById(qualificationCredit.opportunityId);
    if (!opportunity) {
      throw ApplicationException.EntityNotFound(`opportunityId: ${qualificationCredit.opportunityId}`);
    }

    const homeowners = await this.propertyService.findHomeownersById(opportunity.propertyId);
    const primaryContactId = homeowners.find(homeowner => homeowner.isPrimary)?.contactId || '';

    const primaryContact = await this.contactService.getContactById(primaryContactId);

    if (!primaryContact) {
      throw ApplicationException.EntityNotFound(`primaryContact: ${primaryContact}`);
    }

    //Applicants addition
    if (qualificationCredit.hasApplicantConsent) {
      const applicants = qualificationCredit.applicants;
      // type set to applicant
      let applicantIsExist = false;
      let coApplicantIsExist = false;
      applicants?.forEach(applicant => {
        if (applicant?.type === APPLICANT_TYPE.APPLICANT) {
          applicantIsExist = true;
        }
        if (applicant?.type === APPLICANT_TYPE.CO_APPLICANT) {
          coApplicantIsExist = true;
        }
      });

      if (!applicantIsExist) {
        if (!primaryContactId) {
          throw ApplicationException.EntityNotFound(`Applicant contactId: ${primaryContactId}`);
        }

        const applicant = {} as IApplicant;
        applicant.type = APPLICANT_TYPE.APPLICANT;
        applicant.contactId = primaryContactId;
        qualificationCredit.applicants.push(applicant);
      }

      // type set to coapplicant:
      if (!coApplicantIsExist && qualificationCredit.hasCoApplicant && qualificationCredit.hasCoApplicantConsent) {
        const coContactId = homeowners.find(homeowner => !homeowner.isPrimary)?.contactId;
        if (!coContactId) {
          throw ApplicationException.EntityNotFound(`Co applicant contactId: ${coContactId}`);
        }

        const applicant = {} as IApplicant;
        applicant.type = APPLICANT_TYPE.CO_APPLICANT;
        applicant.contactId = coContactId;
        qualificationCredit.applicants.push(applicant);
      }
    }

    //Use case identification
    let isUseCase2: boolean = false;
    let isUseCase1: boolean = false;
    const applicant = qualificationCredit.applicants.find(applicant => applicant.type === APPLICANT_TYPE.APPLICANT);
    const coApplicant = qualificationCredit.applicants.find(applicant => applicant.type === APPLICANT_TYPE.CO_APPLICANT);
    if (applicant && coApplicant && applicant.creditCheckAuthorizedAt && coApplicant.creditCheckAuthorizedAt) {
      throw ApplicationException.UnprocessableEntity(`Application has already been submitted.`);
    } else if (applicant && applicant.creditCheckAuthorizedAt && !coApplicant) {
      throw ApplicationException.UnprocessableEntity(`Application has been submitted.`);
    } else if (applicant && applicant.creditCheckAuthorizedAt && coApplicant && !coApplicant.creditCheckAuthorizedAt) {
      isUseCase2 = true;
    } else if (applicant && !applicant.creditCheckAuthorizedAt) {
      isUseCase1 = true;
    } else {
      throw ApplicationException.UnprocessableEntity(`Invalid use case.`);
    }

    //Contact finding
    let contactId: string = '';
    if (isUseCase2) {
      //Use case 2
      contactId = coApplicant?.contactId || '';
    } else if (isUseCase1) {
      //Use case 1
      contactId = applicant.contactId;
    } else {
      //No email zone
      throw ApplicationException.UnprocessableEntity(`Use case is invalid.`);
    }
    const contact = await this.contactService.getContactById(contactId);
    const token = await this.generateToken(qualificationCredit._id, qualificationCredit.opportunityId, ROLE.CUSTOMER, contact?._id);

    //Email sending
    const data = {
      contactFullName:
        `${contact?.firstName || ''}${(contact?.firstName && ' ') || ''}${contact?.lastName || ''
        }` || 'Customer',
      qualificationValidityPeriod: '48 hours',
      recipientNotice: 'No Content',
      link: (process.env.QUALIFICATION_PAGE || '').concat(`/validation?s=${token}`),
    };

    await this.emailService.sendMailByTemplate(
      contact?.email || '',
      'Qualification Invitation',
      'Qualification Email',
      data,
    );

    const now = new Date();
    const lastEvent = sortByDescending<IEventHistory>(qualificationCredit.eventHistories, 'issueDate').find(ev => ev.detail === 'Email Sent');
    const qualificationCategory =
      qualificationCredit.type === QUALIFICATION_TYPE.HARD
        ? QUALIFICATION_CATEGORY.HARD_CREDIT
        : QUALIFICATION_CATEGORY.SOFT_CREDIT;
    qualificationCredit.eventHistories.push({
      issueDate: now,
      by: req.agentDetail.name || lastEvent?.by || '',
      detail: 'Email Sent',
      userId: req.agentDetail.userId || lastEvent?.userId,
      qualificationCategory,
    });

    qualificationCredit.customerNotifications.push({
      label: 'Applicant',
      type: (isUseCase2 && 'Dual Applicants') || 'Single Applicant',
      sentOn: now,
      email: contact?.email || '',
    });

    qualificationCredit.applicationSentOn = now;
    qualificationCredit.processStatus = PROCESS_STATUS.APPLICATION_EMAILED;
    qualificationCredit.milestone = MILESTONE_STATUS.APPLICATION_EMAILED;

    await qualificationCredit.save();

    return OperationResult.ok(
      strictPlainToClass(SendMailDto, {
        qualificationCredit: qualificationCredit.toJSON(),
      }),
    );
  }

  async getApplicationDetail(req: GetApplicationDetailReqDto): Promise<OperationResult<GetApplicationDetailDto>> {
    const tokenStatus = await this.checkToken(req.token);
    // eslint-disable-next-line default-case
    switch (tokenStatus) {
      case TOKEN_STATUS.EXPIRED:
        throw ApplicationException.ExpiredToken({ responseStatus: false });
      case TOKEN_STATUS.INVALID:
        throw new UnauthorizedException();
    }

    let { qualificationCreditId, opportunityId } = req;

    const tokenPayload = await this.jwtService.verifyAsync(req.token, {
      secret: process.env.QUALIFICATION_JWT_SECRET,
      ignoreExpiration: false,
    });

    if (!opportunityId || !qualificationCreditId) {
      qualificationCreditId = tokenPayload.qualificationCreditId;
      opportunityId = tokenPayload.opportunityId;
    }

    let applicationInitatedBy: string;

    switch (tokenPayload.role) {
      case ROLE.AGENT:
        applicationInitatedBy = 'Agent';
        break;
      case ROLE.CUSTOMER:
        applicationInitatedBy = 'Customer';
        break;
      default:
        applicationInitatedBy = 'Unknown';
        break;
    }

    const qualificationCredit = await this.qualificationCreditModel.findById(qualificationCreditId);
    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound('Qualification Credit');
    }

    if (
      ![PROCESS_STATUS.INITIATED, PROCESS_STATUS.STARTED, PROCESS_STATUS.APPLICATION_EMAILED].includes(
        qualificationCredit.processStatus,
      )
    ) {
      return OperationResult.ok(
        strictPlainToClass(GetApplicationDetailDto, {
          qualificationCreditId,
          processStatus: qualificationCredit.processStatus,
          responseStatus: false,
        }),
      );
    }

    const contactId = tokenPayload.contactId || await this.opportunityService.getContactIdById(qualificationCredit.opportunityId);
    const contact = await this.contactService.getContactById(contactId || '');
    const qualificationCategory =
      qualificationCredit.type === QUALIFICATION_TYPE.HARD
        ? QUALIFICATION_CATEGORY.HARD_CREDIT
        : QUALIFICATION_CATEGORY.SOFT_CREDIT;
    qualificationCredit.processStatus = PROCESS_STATUS.STARTED;
    qualificationCredit.eventHistories.push({
      issueDate: new Date(),
      by: `${contact?.firstName} ${contact?.lastName}`,
      detail: `Application Started by ${applicationInitatedBy}`,
      qualificationCategory,
    });

    await qualificationCredit.save();

    const newToken = await this.generateToken(qualificationCreditId, opportunityId, ROLE.SYSTEM, contactId);

    const hasCoApplicant = qualificationCredit.hasCoApplicant;
    return OperationResult.ok(
      strictPlainToClass(GetApplicationDetailDto, {
        qualificationCreditId,
        opportunityId,
        responseStatus: true,
        processStatus: qualificationCredit.processStatus,
        contact,
        newJWTToken: newToken,
        hasCoApplicant,
        contactId,
      }),
    );
  }

  async receiveFniUpdate(
    req: RecieveFniDecisionReqDto,
    header: string
  ): Promise<any> {
    let res;
    
    const tokenIsValid = await this.tokenService.isTokenValid('fni-wave-communications', header);

    if (!tokenIsValid?.data?.responseStatus) {
      res = {
        responseBody: {
          'transaction': {
            'status': 'error',
            'errorMsgs': [
              'Method Not Allowed'
            ]
          }
        },
        status: 401
      }
      return res;
    }

    const fieldValidation = await this.validateIncomingFniReqBody(req);

    if (!fieldValidation) {
      res = {
        responseBody: {
          'transaction': {
            'status': 'error',
            'errorMsgs': [
              'Bad Request'
            ]
          }
        },
        status: 400
      }
      return res;
    }
    /*
    [WAV-2479] goes here. Save FNI Decision Details. If error, set res to fniDecisionDetailsError and return.
    */
    let fniDecisionDetailsError = {
      responseBody:{
        'transaction': {
          'status': 'error',
          'errorMsgs': [
            'Method Not Allowed'
          ]
        }
      },
      status: 405
    }

    res = {
      responseBody:{
        'transaction': {
          'refnum': req.transaction.refnum,
          'status': 'success'
        }
      },
      status: 200
    }
    return res;
  }

  async processCreditQualification(
    req: ProcessCreditQualificationReqDto,
  ): Promise<OperationResult<{ responseStatus: string }>> {
    this.testTokenStatus(req.authenticationToken);

    const responseStatus = await this.fniEngineService.processFniSolarApplyRequest(req);
    return OperationResult.ok({ responseStatus });
  }

  async applyCreditQualification(
    req: ApplyCreditQualificationReqDto,
  ): Promise<OperationResult<{ responseStatus: string }>> {
    // NOTE: NEVER NEVER NEVER NEVER store the applyCreditQualificationRequestParam or fniApplyRequestInst in the database
    // NOTE: NEVER NEVER NEVER NEVER log the applyCreditQualificationRequestParam or fniApplyRequestInst
    // NOTE: Copy this warning and paste it in the code at the top and bottom of this method

    await this.testTokenStatus(req.authenticationToken);

    const qualificationCredit = await this.qualificationCreditModel.findById(req.qualificationCreditId);
    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound('Qualification Credit');
    }

    if (qualificationCredit.processStatus !== PROCESS_STATUS.STARTED) {
      return OperationResult.ok({ responseStatus: 'NO_ACTIVE_VALIDATION' });
    }

    if (req.opportunityId !== qualificationCredit.opportunityId) {
      throw new HttpException('Invalid opportunityId.', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const opportunity = await this.opportunityService.getDetailById(req.opportunityId);

    if (!opportunity) {
      throw ApplicationException.EntityNotFound(`opportunityId: ${req.opportunityId}`);
    }

    const qualificationCategory =
      qualificationCredit.type === QUALIFICATION_TYPE.HARD
        ? QUALIFICATION_CATEGORY.HARD_CREDIT
        : QUALIFICATION_CATEGORY.SOFT_CREDIT;
    qualificationCredit.processStatus = PROCESS_STATUS.IN_PROGRESS;
    qualificationCredit.eventHistories.push({
      issueDate: new Date(),
      by: `${req.applicant.firstName} ${req.applicant.lastName}`,
      detail: 'Application sent for Credit Check',
      qualificationCategory,
    });

    const applicantIndex = qualificationCredit.applicants.findIndex(applicant => applicant.contactId === req.contactId);
    if (qualificationCredit.applicants[applicantIndex]) {
      qualificationCredit.applicants[applicantIndex].agreementTerm1CheckedAt =
        req.acknowledgement.agreement_term_1_checked_at;
      qualificationCredit.applicants[applicantIndex].creditCheckAuthorizedAt =
        req.acknowledgement.credit_check_authorized_at;
      if (req.acknowledgement.joint_intention_disclosure_accepted_at) {
        qualificationCredit.applicants[applicantIndex].jointIntentionDisclosureCheckedAt =
          req.acknowledgement.joint_intention_disclosure_accepted_at;
      }
    } else {
      const subject = 'There was a problem processing your request. Please contact your Sales Agent for Assistance.';
      const body = `Request body recieved to /appy-credit-qualification:\n${req}`;
      process.env.SUPPORT_MAIL && (await this.emailService.sendMail(process.env.SUPPORT_MAIL, body, subject));

      const e = {
        name: 'No matching contact found in applicants[]',
        message: subject,
        stack: 'wave-quote-service/src/qualifications/qualification.service.ts:applyCreditQualification',
      };

      this.logger.error(e, e.stack);
      return OperationResult.error(e);
    }

    await qualificationCredit.save();

    const { opportunityId, applicant, applicantSecuredData, primaryResidence, installationAddress } = req;

    const fniInitApplyReq: IFniApplyReq = {
      opportunityId,
      productId: '1', // <To get productId use quoteService method created in this ticket: WAV-3308>
      applicant,
      applicantSecuredData,
      primaryResidence,
      installationAddress,
    };

    const { hasCoApplicant, applicants } = qualificationCredit;

    let fniResponse;
    if (hasCoApplicant && applicants[applicantIndex].type === APPLICANT_TYPE.CO_APPLICANT) {
      const activeFniApplicationIdx = qualificationCredit.fniApplications.findIndex(
        fniApplication => fniApplication.state === FNI_APPLICATION_STATE.ACTIVE,
      );

      if (activeFniApplicationIdx === -1) {
        throw ApplicationException.ActiveFniApplicationNotFound(req.qualificationCreditId);
      }

      fniInitApplyReq.refnum = qualificationCredit.fniApplications[activeFniApplicationIdx].refnum;

      fniResponse = await this.fniEngineService.applyCoApplicant(fniInitApplyReq);
    } else {
      fniResponse = await this.fniEngineService.applyPrimaryApplicant(fniInitApplyReq);
    }

    await this.handleFNIInitResponse({
      applyRequestData: req,
      fniResponse,
      qualificationCreditRecordInst: qualificationCredit,
    });

    let responseStatus: any;
    if (!hasCoApplicant || applicants[applicantIndex].type === APPLICANT_TYPE.CO_APPLICANT) {
      // TODO for WAV-488
      const applyResponse = 'SUCCESS';
      responseStatus = await this.handleFNIResponse(
        applyResponse,
        `${req.applicant.firstName} ${req.applicant.lastName}`,
        qualificationCredit,
      );
    } else {
      //Send email to Co-Applicant (Use Case 2)
      try {
        await this.qualificationMailHandler({
          opportunityId: req.opportunityId,
          qualificationCreditId: req.qualificationCreditId,
          agentDetail: {
            userId: '',
            name: ''
          }
        }, qualificationCredit);
      } catch (error) {
        this.logger.error(error, error?.stack);
      }
      responseStatus = APPLICATION_PROCESS_STATUS.APPLICATION_PROCESS_SUCCESS;
    }

    return OperationResult.ok({ responseStatus });
  }

  // ==============> INTERNAL <==============

  async testTokenStatus(authenticationToken: string): Promise<void> {
    const tokenStatus = await this.checkToken(authenticationToken);
    // eslint-disable-next-line default-case
    switch (tokenStatus) {
      case TOKEN_STATUS.EXPIRED:
        throw ApplicationException.ExpiredToken({ responseStatus: 'EXPIRED_TOKEN' });
      case TOKEN_STATUS.INVALID:
        throw new UnauthorizedException();
      case TOKEN_STATUS.VALID: {
        const tokenPayload = await this.jwtService.verifyAsync(authenticationToken, {
          secret: process.env.QUALIFICATION_JWT_SECRET,
          ignoreExpiration: true,
        });

        if (tokenPayload.role !== ROLE.SYSTEM) {
          throw new UnauthorizedException();
        }
      }
    }
  }

  async generateToken(qualificationCreditId: string, opportunityId: string, role: ROLE, contactId?: string): Promise<string> {
    let tokenExpiry: string;

    switch (role) {
      case ROLE.AGENT:
        tokenExpiry = '30m';
        break;
      case ROLE.CUSTOMER:
        tokenExpiry = '48h';
        break;
      // 'SYSTEM'
      default:
        tokenExpiry = '30m';
        break;
    }

    const found = await this.qualificationCreditModel.findById(qualificationCreditId).lean();
    if (!found) {
      throw ApplicationException.EntityNotFound(qualificationCreditId);
    }
    const tokenData: ITokenData = {
      role,
      opportunityId,
      qualificationCreditId,
      contactId
    }
    if (!contactId) delete tokenData.contactId;

    return this.jwtService.sign(
      tokenData,
      { expiresIn: tokenExpiry, secret: process.env.QUALIFICATION_JWT_SECRET },
    );
  }

  // eslint-disable-next-line consistent-return
  async checkToken(token: string) {
    let tokenPayload: any;

    try {
      tokenPayload = await this.jwtService.verifyAsync(token, {
        secret: process.env.QUALIFICATION_JWT_SECRET,
        ignoreExpiration: true,
      });

      if (tokenPayload) {
        try {
          await this.jwtService.verifyAsync(token, {
            secret: process.env.QUALIFICATION_JWT_SECRET,
            ignoreExpiration: false,
          });
          return TOKEN_STATUS.VALID;
        } catch (error) {
          return TOKEN_STATUS.EXPIRED;
        }
      }
    } catch (error) {
      return TOKEN_STATUS.INVALID;
    }
  }

  async handleFNIResponse(
    fniResponse: string,
    customerNameInst: string,
    qualificationCreditRecordInst: LeanDocument<QualificationCredit>,
  ): Promise<string> {
    let applyCreditQualificationResponseStatus = '';
    const qualificationCategory =
      qualificationCreditRecordInst.type === QUALIFICATION_TYPE.HARD
        ? QUALIFICATION_CATEGORY.HARD_CREDIT
        : QUALIFICATION_CATEGORY.SOFT_CREDIT;
    // eslint-disable-next-line default-case
    switch (fniResponse) {
      case 'SUCCESS': {
        applyCreditQualificationResponseStatus = 'APPLICATION_PROCESS_SUCCESS';
        qualificationCreditRecordInst.processStatus = PROCESS_STATUS.COMPLETED;
        qualificationCreditRecordInst.eventHistories.push({
          issueDate: new Date(),
          by: customerNameInst,
          detail: 'Credit Validation Completed',
          qualificationCategory,
        });
        qualificationCreditRecordInst.approvalMode = APPROVAL_MODE.CREDIT_VENDOR;
        qualificationCreditRecordInst.qualificationStatus = QUALIFICATION_STATUS.APPROVED;
        qualificationCreditRecordInst.approvedBy = 'SYSTEM';
        break;
      }
      case 'FAILURE': {
        applyCreditQualificationResponseStatus = 'APPLICATION_PROCESS_SUCCESS';
        qualificationCreditRecordInst.processStatus = PROCESS_STATUS.COMPLETED;
        qualificationCreditRecordInst.eventHistories.push({
          issueDate: new Date(),
          by: customerNameInst,
          detail: 'Credit Validation Completed',
          qualificationCategory,
        });
        qualificationCreditRecordInst.approvalMode = APPROVAL_MODE.CREDIT_VENDOR;
        qualificationCreditRecordInst.qualificationStatus = QUALIFICATION_STATUS.DECLINED;
        qualificationCreditRecordInst.approvedBy = 'SYSTEM';
        break;
      }
      case 'PENDING': {
        applyCreditQualificationResponseStatus = 'APPLICATION_PROCESS_SUCCESS';
        qualificationCreditRecordInst.processStatus = PROCESS_STATUS.PENDING;
        qualificationCreditRecordInst.eventHistories.push({
          issueDate: new Date(),
          by: customerNameInst,
          detail: 'Credit Validation In Progress',
          qualificationCategory,
        });
        qualificationCreditRecordInst.approvalMode = APPROVAL_MODE.CREDIT_VENDOR;
        qualificationCreditRecordInst.qualificationStatus = QUALIFICATION_STATUS.PENDING;
        qualificationCreditRecordInst.approvedBy = 'SYSTEM';
        break;
      }
      case 'ERROR': {
        applyCreditQualificationResponseStatus = 'APPLICATION_PROCESS_ERROR';
        return applyCreditQualificationResponseStatus;
      }
    }
    qualificationCreditRecordInst.milestone = MILESTONE_STATUS.APPLICATION_STATUS;
    await this.qualificationCreditModel.updateOne(
      { _id: qualificationCreditRecordInst.id },
      qualificationCreditRecordInst,
    );
    return applyCreditQualificationResponseStatus;
  }

  async handleFNIInitResponse(data: {
    applyRequestData: ApplyCreditQualificationReqDto;
    fniResponse: IFniResponse;
    qualificationCreditRecordInst: LeanDocument<QualificationCredit>;
  }): Promise<void> {
    const { applyRequestData, fniResponse, qualificationCreditRecordInst } = data;
    const { type, status, data: fniResponseData } = fniResponse;

    let isError = true;
    if (status === HttpStatus.OK) {
      if (!fniResponseData || !fniResponseData.transaction) {
        throw new NotFoundException(`FNI Response to ${type} is undefined or contains no transaction`);
      }
      const { transaction, application, field_descriptions, stips } = fniResponseData;

      const activeFniApplicationIdx = qualificationCreditRecordInst.fniApplications.findIndex(
        fniApplication => fniApplication.state === FNI_APPLICATION_STATE.ACTIVE,
      );

      if (activeFniApplicationIdx === -1) {
        throw ApplicationException.ActiveFniApplicationNotFound(qualificationCreditRecordInst._id);
      }

      const activeFniApplication = qualificationCreditRecordInst.fniApplications[activeFniApplicationIdx];

      if (transaction.status === FNI_TRANSACTION_STATUS.SUCCESS) {
        isError = false;

        if (type === FNI_REQUEST_TYPE.SOLAR_INIT) {
          activeFniApplication.refnum = parseInt(transaction.refnum, 10);
        }
        activeFniApplication.fniCurrentDecisionReceivedAt = application?.timeReceived;
        activeFniApplication.fniCurrentDecision = application?.currDecision;
      }

      const response: IFniApplicationResponse = {
        type,
        transactionStatus: isError ? FNI_TRANSACTION_STATUS.ERROR : FNI_TRANSACTION_STATUS.SUCCESS,
        rawResponse: { transaction, application, field_descriptions, stips },
        createdAt: new Date(),
      };

      activeFniApplication.responses.push(response);

      qualificationCreditRecordInst.fniApplications[activeFniApplicationIdx] = activeFniApplication;

      await this.qualificationCreditModel.updateOne(
        { _id: qualificationCreditRecordInst.id },
        qualificationCreditRecordInst,
      );
    }

    if (isError) {
      let subject;
      let message;

      if (status === HttpStatus.OK && fniResponseData!.transaction.status === FNI_TRANSACTION_STATUS.ERROR) {
        subject = this.getFniErrorSubject({ type });
        message = {
          opportunityId: applyRequestData.opportunityId,
          transaction: fniResponseData!.transaction,
        };
      } else {
        subject = this.getFniErrorSubject({ type, status });
        message = {
          opportunityId: applyRequestData.opportunityId,
        };
      }

      // eslint-disable-next-line no-unused-expressions
      process.env.SUPPORT_MAIL &&
        this.emailService.sendMail(process.env.SUPPORT_MAIL!, JSON.stringify(message), subject).catch(err => {
          console.error(`Send mail error`, err);
        });

      throw ApplicationException.FniProcessError();
    }
  }

  async getOneById(id: string): Promise<LeanDocument<QualificationCredit> | null> {
    const res = await this.qualificationCreditModel.findById(id).lean();
    return res;
  }

  async countByOpportunityId(opportunityId: string): Promise<number> {
    const counter = await this.qualificationCreditModel.countDocuments({ opportunityId });
    return counter;
  }

  async getSoftAndHardFNIQualificationByOpportunityId({
    opportunityId,
    condition,
    projection,
  }: {
    opportunityId: string;
    condition?;
    projection?;
  }): Promise<QualificationCredit[]> {
    return this.qualificationCreditModel
      .find(
        {
          opportunityId,
          approvalMode: APPROVAL_MODE.CREDIT_VENDOR,
          type: { $in: [QUALIFICATION_TYPE.SOFT, QUALIFICATION_TYPE.HARD] },
          ...condition,
        },
        projection,
      )
      .lean();
  }

  // ===================== INTERNAL =====================

  private getFniErrorSubject(data: { type: string; status?: number }) {
    const { type, status } = data;
    return `FNI ${type} :: ${FNI_RESPONSE_ERROR_MAP[status || -1] || 'Error'}`;
  }


  private async validateIncomingFniReqBody(req: RecieveFniDecisionReqDto) {
    const prodIdRegex = new RegExp('[0-9]');

    const stringsToValidate = [req.transaction?.refnum, req.application?.currDecision,
    req.application?.productId, req.application?.timeReceived];
    
    if (stringsToValidate.filter(s => !typeof String).length || stringsToValidate.filter(s => s === undefined || s === '').length) {
      return false;
    }

    const currDecisionHasValidValue = req.application?.currDecision === 'APPROVED' || 
      req.application?.currDecision === 'DECLINED' ||
      req.application?.currDecision ==='PENDING' ||
      req.application?.currDecision === 'WITHDRAWN';

    if (req.application.currDecision.length > 20 || !currDecisionHasValidValue) {
      return false;
    }

    if (req.application?.productId.length > 2 || !prodIdRegex.test(req.application?.productId)) {
      return false;
    }

    if (req.application?.timeReceived.length > 26) {
      return false;
    }

    return true;
  }
}

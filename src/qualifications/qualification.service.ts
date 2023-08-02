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
import { QuoteService } from 'src/quotes/quote.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { sortByDescending } from 'src/utils/array';
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
  EVENT_HISTORY_DETAIL,
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
import { QualificationException, QualificationExceptionData } from './qualification.exception';
import { IApplicant, IEventHistory, IFniApplicationResponse, QUALIFICATION_CREDIT, QualificationCredit } from './qualification.schema';
import {
  AgentDetailDto,
  ApplyCreditQualificationReqDto,
  CreateQualificationReqDto,
  GetApplicationDetailReqDto,
  RecieveFniDecisionReqDto,
  SendMailReqDto,
  SetApplicantConsentReqDto,
  SetManualApprovalReqDto,
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
import { IFniApplyReq, IFniResponse, IFniResponseData, ITokenData } from './typing.d';
import { getQualificationMilestoneAndProcessStatusByVerbalConsent } from './utils';

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
    private readonly quoteService: QuoteService,
  ) {}

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
          detail: EVENT_HISTORY_DETAIL.REQUEST_INITIATED,
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

  async reInitiateQualification(
    qualificationCreditId: ObjectId,
    agentDetail: AgentDetailDto,
  ): Promise<OperationResult<QualificationDetailDto>> {
    const qualificationCredit = await this.qualificationCreditModel.findById(qualificationCreditId);

    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound(`qualificationCreditId: ${qualificationCreditId}`);
    }

    const qualificationCategory =
      qualificationCredit.type === QUALIFICATION_TYPE.HARD
        ? QUALIFICATION_CATEGORY.HARD_CREDIT
        : QUALIFICATION_CATEGORY.SOFT_CREDIT;

    qualificationCredit.eventHistories.push({
      issueDate: new Date(),
      by: agentDetail.name,
      detail: EVENT_HISTORY_DETAIL.REQUEST_RE_INITIATED,
      userId: agentDetail.userId,
      qualificationCategory,
    });

    await qualificationCredit.save();

    return OperationResult.ok(strictPlainToClass(QualificationDetailDto, qualificationCredit.toJSON()));
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
      detail: EVENT_HISTORY_DETAIL.CREDIT_CHECK_APPROVAL_BY_AGENT,
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
            detail: EVENT_HISTORY_DETAIL.COAPPLICANT_CONSENT_SET_TO_YES,
            qualificationCategory,
          });
        } else {
          qualificationCredit.eventHistories.push({
            issueDate: now,
            by: applicantConsentDto.userFullName,
            detail: EVENT_HISTORY_DETAIL.COAPPLICANT_CONSENT_SET_TO_NO,
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
            detail: EVENT_HISTORY_DETAIL.HAS_COAPPLICANT_SET_TO_YES,
            qualificationCategory,
          });
        } else {
          qualificationCredit.eventHistories.push({
            issueDate: now,
            by: applicantConsentDto.userFullName,
            detail: EVENT_HISTORY_DETAIL.HAS_COAPPLICANT_SET_TO_NO,
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
            detail: EVENT_HISTORY_DETAIL.APPLICANT_CONSENT_SET_TO_YES,
            qualificationCategory,
          });
        } else {
          qualificationCredit.eventHistories.push({
            issueDate: now,
            by: applicantConsentDto.userFullName,
            detail: EVENT_HISTORY_DETAIL.APPLICANT_CONSENT_SET_TO_NO,
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
     fniCurrentDecisionReasons: [],
      responses: [],
    });

    qualificationCredit.applicants.forEach(item => {
      item.creditCheckAuthorizedAt = undefined;
      item.agreementTerm1CheckedAt = undefined;
      item.jointIntentionDisclosureCheckedAt = undefined;
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
    useCase2: boolean = false,
  ): Promise<OperationResult<SendMailDto>> {
    const lastEvent = sortByDescending<IEventHistory>(qualificationCredit.eventHistories, 'issueDate').find(
      ev => ev.detail === 'Email Sent',
    );

    const qualificationExceptionPayload: QualificationExceptionData = {
      qualificationCreditId: qualificationCredit._id.toString(),
      errorEvent: {
        by: req.agentDetail.name || lastEvent?.by || '',
        detail: useCase2
          ? EVENT_HISTORY_DETAIL.UNABLE_TO_SEND_EMAIL_TO_CO_APPLICANT
          : EVENT_HISTORY_DETAIL.UNABLE_TO_SEND_EMAIL,
        userId: req.agentDetail.userId || lastEvent?.userId,
      },
    };

    const { hasApplicantConsent, hasCoApplicant, hasCoApplicantConsent } = qualificationCredit;

    if (
      hasApplicantConsent === undefined ||
      hasCoApplicant === undefined ||
      (hasCoApplicant && hasCoApplicantConsent === undefined)
    ) {
      throw new QualificationException(
        ApplicationException.UnprocessableEntity(`Invalid use case.`),
        qualificationExceptionPayload,
      );
    }

    const opportunity = await this.opportunityService.getDetailById(qualificationCredit.opportunityId);
    if (!opportunity) {
      throw new QualificationException(
        ApplicationException.EntityNotFound(`opportunityId: ${qualificationCredit.opportunityId}`),
        qualificationExceptionPayload,
      );
    }

    const homeowners = await this.propertyService.findHomeownersById(opportunity.propertyId);
    const primaryContactId = homeowners.find(homeowner => homeowner.isPrimary)?.contactId || '';

    const primaryContact = await this.contactService.getContactById(primaryContactId);

    if (!primaryContact) {
      throw new QualificationException(
        ApplicationException.EntityNotFound(`primaryContact: ${primaryContact}`),
        qualificationExceptionPayload,
      );
    }

    // Applicants addition
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
        throw new QualificationException(
          ApplicationException.EntityNotFound(`Applicant contactId: ${primaryContactId}`),
          qualificationExceptionPayload,
        );
      }
      const applicant = {} as IApplicant;
      applicant.type = APPLICANT_TYPE.APPLICANT;
      applicant.contactId = primaryContactId;
      applicants.push(applicant);
    }

    // type set to coapplicant:
    if (!coApplicantIsExist && qualificationCredit.hasCoApplicant) {
      const coContactId = homeowners.find(homeowner => !homeowner.isPrimary)?.contactId;
      if (!coContactId) {
        throw new QualificationException(
          ApplicationException.EntityNotFound(`Co applicant contactId: ${coContactId}`),
          qualificationExceptionPayload,
        );
      }

      const applicant = {} as IApplicant;
      applicant.type = APPLICANT_TYPE.CO_APPLICANT;
      applicant.contactId = coContactId;
      applicants.push(applicant);
    }

    //Use case identification
    let isUseCase1: boolean = false;
    let isUseCase2: boolean = useCase2;
    const applicant = applicants.find(applicant => applicant.type === APPLICANT_TYPE.APPLICANT);
    const coApplicant = applicants.find(applicant => applicant.type === APPLICANT_TYPE.CO_APPLICANT);
    if (applicant && coApplicant && applicant.creditCheckAuthorizedAt && coApplicant.creditCheckAuthorizedAt) {
      throw new QualificationException(
        ApplicationException.UnprocessableEntity(`Application has already been submitted.`),
        qualificationExceptionPayload,
      );
    } else if (applicant && applicant.creditCheckAuthorizedAt && !coApplicant) {
      throw new QualificationException(
        ApplicationException.UnprocessableEntity(`Application has been submitted.`),
        qualificationExceptionPayload,
      );
    } else if (applicant && applicant.creditCheckAuthorizedAt && coApplicant && !coApplicant.creditCheckAuthorizedAt) {
      isUseCase2 = true;
    } else if (applicant && !applicant.creditCheckAuthorizedAt) {
      isUseCase1 = true;
    } else {
      throw new QualificationException(
        ApplicationException.UnprocessableEntity(`Invalid use case.`),
        qualificationExceptionPayload,
      );
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
      throw new QualificationException(
        ApplicationException.UnprocessableEntity(`Use case is invalid.`),
        qualificationExceptionPayload,
      );
    }
    const contact = await this.contactService.getContactById(contactId);
    const token = await this.generateToken(
      qualificationCredit._id,
      qualificationCredit.opportunityId,
      ROLE.CUSTOMER,
      contact?._id,
    );

    //Email sending
    const data = {
      contactFullName:
        `${contact?.firstName || ''}${(contact?.firstName && ' ') || ''}${contact?.lastName || ''}` || 'Customer',
      qualificationValidityPeriod: '48 hours',
      recipientNotice: 'No Content',
      link: (process.env.QUALIFICATION_PAGE || '').concat(`/validation?s=${token}`),
    };

    try {
      await this.emailService.sendMailByTemplate(
        contact?.email || '',
        'Qualification Invitation',
        'Qualification Email',
        data,
      );
    } catch (error) {
      throw new QualificationException(ApplicationException.ServiceError(), qualificationExceptionPayload);
    }

    const now = new Date();
    const qualificationCategory =
      qualificationCredit.type === QUALIFICATION_TYPE.HARD
        ? QUALIFICATION_CATEGORY.HARD_CREDIT
        : QUALIFICATION_CATEGORY.SOFT_CREDIT;
    qualificationCredit.eventHistories.push({
      issueDate: now,
      by: req.agentDetail.name || lastEvent?.by || '',
      detail: EVENT_HISTORY_DETAIL.EMAIL_SENT,
      userId: req.agentDetail.userId || lastEvent?.userId,
      qualificationCategory,
    });

    qualificationCredit.customerNotifications.push({
      label: 'Applicant',
      type: (isUseCase2 && 'Dual Applicants') || 'Single Applicant',
      sentOn: now,
      email: primaryContact?.email || '',
    });

    qualificationCredit.applicationSentOn = now;
    qualificationCredit.processStatus = PROCESS_STATUS.APPLICATION_EMAILED;
    qualificationCredit.milestone = MILESTONE_STATUS.APPLICATION_EMAILED;

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

    await qualificationCredit.save();

    return OperationResult.ok(
      strictPlainToClass(SendMailDto, {
        qualificationCredit: qualificationCredit.toJSON(),
      }),
    );
  }

  async getApplicationDetail(req: GetApplicationDetailReqDto): Promise<OperationResult<GetApplicationDetailDto>> {
    
    const decodedToken = await this.decodeCreditQualificationToken('getApplicationDetail', req, req.token);

    let qualificationCreditId = decodedToken.qualificationCreditId;
    let opportunityId = decodedToken.opportunityId;

    const qualificationCredit = await this.qualificationCreditModel.findById(qualificationCreditId);
    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound('Qualification Credit');
    }
    
    const contactId =
    decodedToken.contactId || (await this.opportunityService.getContactIdById(qualificationCredit.opportunityId));
    const contact = await this.contactService.getContactById(contactId || '');
    const qualificationCategory =
      qualificationCredit.type === QUALIFICATION_TYPE.HARD
        ? QUALIFICATION_CATEGORY.HARD_CREDIT
        : QUALIFICATION_CATEGORY.SOFT_CREDIT;
    qualificationCredit.processStatus = PROCESS_STATUS.STARTED;

    const applicantIndex = qualificationCredit.applicants.findIndex(applicant => applicant.contactId === contactId);
    const currentApplicant = qualificationCredit.applicants[applicantIndex];

    const eligibleQuotes = await this.getEligibleQuotes(opportunityId);
    if (eligibleQuotes.length == 0) {
      const qualificationExceptionPayload: QualificationExceptionData = {
        qualificationCreditId: qualificationCredit._id.toString(),
        errorEvent: {
          by: currentApplicant.type,
          detail: 'Unable to Show Application',
        },
      };
      throw new QualificationException(
        ApplicationException.EntityNotFound('Eligible Quote'),
        qualificationExceptionPayload,
      );
    }

    let applicationInitatedBy: string;

    switch (decodedToken.role) {
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

    if (
      ![PROCESS_STATUS.INITIATED, PROCESS_STATUS.STARTED, PROCESS_STATUS.APPLICATION_EMAILED].includes(
        qualificationCredit.processStatus as PROCESS_STATUS,
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

    qualificationCredit.eventHistories.push({
      issueDate: new Date(),
      by: currentApplicant.type,
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

  async receiveFniUpdate(req: RecieveFniDecisionReqDto, header: string): Promise<any> {
    let res;

    const tokenIsValid = await this.tokenService.isTokenValid('fni-wave-communications', header);

    if (!tokenIsValid?.data?.responseStatus) {
      res = {
        responseBody: {
          transaction: {
            status: 'error',
            errorMsgs: ['Method Not Allowed'],
          },
        },
        status: 401,
      };
      return res;
    }

    const fniDecisionDetailsError = {
      responseBody: {
        transaction: {
          status: 'error',
          errorMsgs: ['Method Not Allowed'],
        },
      },
      status: 405,
    };

    const qualificationCredit = await this.findQualificationCreditByRefnum(req.transaction.refnum);

    if (!qualificationCredit) return fniDecisionDetailsError;

    const errorEvent: IEventHistory = {
      issueDate: new Date(),
      by: 'System',
      detail: 'Unable to process incoming Application data',
    };

    const fieldValidation = await this.validateIncomingFniReqBody(req);

    if (!fieldValidation) {
      qualificationCredit.eventHistories.push(errorEvent);
      await this.qualificationCreditModel.updateOne({ _id: qualificationCredit.id }, qualificationCredit);

      res = {
        responseBody: {
          transaction: {
            status: 'error',
            errorMsgs: ['Bad Request'],
          },
        },
        status: 400,
      };
      return res;
    }

    const handleData: IFniResponse = {
      type: FNI_REQUEST_TYPE.SOLAR_APPLY_INCOMING,
      status: HttpStatus.OK,
      data: (req as unknown) as IFniResponseData,
    };

    try {
      await this.handleProcessFniSolarApplyResponse({
        qualificationCreditId: qualificationCredit._id.toString(),
        opportunityId: qualificationCredit.opportunityId,
        fniResponse: handleData,
      });

      res = {
        responseBody: {
          transaction: {
            refnum: req.transaction.refnum,
            status: 'success',
          },
        },
        status: 200,
      };
    } catch (error) {
      res = fniDecisionDetailsError;
      this.logger.error(error);
    }

    return res;
  }

  async processCreditQualification(
    processRequestData: ProcessCreditQualificationReqDto,
  ): Promise<APPLICATION_PROCESS_STATUS> {
    const qualificationCredit = await this.qualificationCreditModel.findById(processRequestData.qualificationCreditId);
    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound('Qualification Credit');
    }

    const fniResponse = await this.fniEngineService.processFniSolarApplyRequest(processRequestData);
    const responseStatus = await this.handleProcessFniSolarApplyResponse({
      qualificationCreditId: processRequestData.qualificationCreditId,
      opportunityId: processRequestData.opportunityId,
      fniResponse,
    });

    return responseStatus as APPLICATION_PROCESS_STATUS;
  }

  async applyCreditQualification(
    req: ApplyCreditQualificationReqDto,
  ): Promise<OperationResult<{ responseStatus: string }>> {
    // NOTE: NEVER NEVER NEVER NEVER store the applyCreditQualificationRequestParam or fniApplyRequestInst in the database
    // NOTE: NEVER NEVER NEVER NEVER log the applyCreditQualificationRequestParam or fniApplyRequestInst
    // NOTE: Copy this warning and paste it in the code at the top and bottom of this method

    await this.decodeCreditQualificationToken('applyCreditQualification', req, req.authenticationToken);
    
    const qualificationCredit = await this.qualificationCreditModel.findById(req.qualificationCreditId);

    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound('Qualification Credit');
    }

    if (qualificationCredit.processStatus !== PROCESS_STATUS.STARTED) {
      return OperationResult.ok({ responseStatus: 'NO_ACTIVE_VALIDATION' });
    }

    const applicantIndex = qualificationCredit.applicants.findIndex(applicant => applicant.contactId === req.contactId);
    const currentApplicant = qualificationCredit.applicants[applicantIndex];

    const qualificationExceptionPayload: QualificationExceptionData = {
      qualificationCreditId: qualificationCredit._id.toString(),
      errorEvent: {
        by: currentApplicant.type,
        detail: EVENT_HISTORY_DETAIL.UNABLE_TO_PROCESS_APPLICATION,
      },
    };

    if (req.opportunityId !== qualificationCredit.opportunityId) {
      throw new QualificationException(
        new HttpException('Invalid opportunityId.', HttpStatus.UNPROCESSABLE_ENTITY),
        qualificationExceptionPayload,
      );
    }

    const eligibleQuotes = await this.getEligibleQuotes(req.opportunityId);
    if (eligibleQuotes.length == 0) {
      throw ApplicationException.EntityNotFound('Eligible Quote');
    }

    const opportunity = await this.opportunityService.getDetailById(req.opportunityId);

    if (!opportunity) {
      throw new QualificationException(
        ApplicationException.EntityNotFound(`opportunityId: ${req.opportunityId}`),
        qualificationExceptionPayload,
      );
    }

    if (currentApplicant) {
      currentApplicant.agreementTerm1CheckedAt = req.acknowledgement.agreement_term_1_checked_at;
      currentApplicant.creditCheckAuthorizedAt = req.acknowledgement.credit_check_authorized_at;
      if (req.acknowledgement.joint_intention_disclosure_accepted_at) {
        currentApplicant.jointIntentionDisclosureCheckedAt = req.acknowledgement.joint_intention_disclosure_accepted_at;
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
      throw new QualificationException(ApplicationException.FniProcessError(), qualificationExceptionPayload);
    }

    const qualificationCategory =
      qualificationCredit.type === QUALIFICATION_TYPE.HARD
        ? QUALIFICATION_CATEGORY.HARD_CREDIT
        : QUALIFICATION_CATEGORY.SOFT_CREDIT;

    qualificationCredit.processStatus = PROCESS_STATUS.IN_PROGRESS;
    qualificationCredit.approvalMode = APPROVAL_MODE.CREDIT_VENDOR;

    qualificationCredit.eventHistories.push({
      issueDate: new Date(),
      by: currentApplicant.type,
      detail: EVENT_HISTORY_DETAIL.APPLICATION_SENT_FOR_CREDIT_CHECK,
      qualificationCategory,
    });

    await qualificationCredit.save();

    const { opportunityId, applicant, applicantSecuredData, primaryResidence, installationAddress } = req;

    const fniInitApplyReq: IFniApplyReq = {
      opportunityId,
      productId: '', // will be populated from fundProductScoreCard when calling solar_init
      applicant,
      applicantSecuredData,
      primaryResidence,
      installationAddress,
    };

    let fniResponse;
    const { hasCoApplicant } = qualificationCredit;

    // solar_init || solar_initcoapp
    if (hasCoApplicant && currentApplicant.type === APPLICANT_TYPE.CO_APPLICANT) {
      const activeFniApplicationIdx = qualificationCredit.fniApplications.findIndex(
        fniApplication => fniApplication.state === FNI_APPLICATION_STATE.ACTIVE,
      );

      if (activeFniApplicationIdx === -1) {
        throw new QualificationException(
          ApplicationException.ActiveFniApplicationNotFound(req.qualificationCreditId),
          qualificationExceptionPayload,
        );
      }

      fniInitApplyReq.refnum = qualificationCredit.fniApplications[activeFniApplicationIdx].refnum;

      fniResponse = await this.fniEngineService.applyCoApplicant(fniInitApplyReq);
    } else {
      if (eligibleQuotes.length == 0) {
        throw new NotFoundException('Qualification has no Eligible Quote');
      } else {
        fniInitApplyReq.productId =
          eligibleQuotes[0].detailedQuote.quoteFinanceProduct.financeProduct.financialProductSnapshot.fundProductScoreCard;
      }
      fniResponse = await this.fniEngineService.applyPrimaryApplicant(fniInitApplyReq);
    }

    await this.handleFNIInitResponse({
      fniResponse,
      qualificationCreditRecordInst: qualificationCredit,
    });

    // Send email to Co-Applicant (Use Case 2)
    // -> currentApplicant should be the primary applicant
    if (hasCoApplicant && currentApplicant.type === APPLICANT_TYPE.APPLICANT) {
      try {
        const qualificationCredit = await this.qualificationCreditModel.findById(req.qualificationCreditId);

        await this.qualificationMailHandler(
          {
            opportunityId: req.opportunityId,
            qualificationCreditId: req.qualificationCreditId,
            agentDetail: {
              userId: '',
              name: '',
            },
          },
          qualificationCredit!,
          true,
        );
      } catch (error) {
        this.logger.error(error, error?.stack);
      }
    }

    // Make Call to solar_apply only if:
    // for use case 1: currentApplicant === APPLICANT_TYPE.APPLICANT (always)
    // for use case 2: currentApplicant === APPLICANT_TYPE.CO_APPLICANT
    let responseStatus = APPLICATION_PROCESS_STATUS.APPLICATION_PROCESS_SUCCESS;
    if (
      !hasCoApplicant || // Primary Applicant only (Use Case 1)
      currentApplicant.type === APPLICANT_TYPE.CO_APPLICANT // Co-Applicant within: Use case 2 or 3
    ) {
      responseStatus = await this.processCreditQualification({
        qualificationCreditId: req.qualificationCreditId,
        opportunityId: req.opportunityId,
        refnum: fniResponse.data.transaction.refnum,
        authenticationToken: req.authenticationToken,
      });
    }

    return OperationResult.ok({ responseStatus });
  }

  // ==============> INTERNAL <==============

  async findQualificationCreditByRefnum(refnum: string): Promise<LeanDocument<QualificationCredit>> {
    return this.qualificationCreditModel
      .findOne({
        'fniApplications.refnum': parseInt(refnum, 10),
      })
      .lean();
  }

  async generateToken(
    qualificationCreditId: string,
    opportunityId: string,
    role: ROLE,
    contactId?: string,
  ): Promise<string> {
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
      contactId,
    };
    if (!contactId) delete tokenData.contactId;

    return this.jwtService.sign(tokenData, { expiresIn: tokenExpiry, secret: process.env.QUALIFICATION_JWT_SECRET });
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

  async handleFNIInitResponse(data: {
    fniResponse: IFniResponse;
    qualificationCreditRecordInst: LeanDocument<QualificationCredit>;
  }): Promise<void> {
    const { fniResponse, qualificationCreditRecordInst } = data;
    const { type, status, data: fniResponseData } = fniResponse;

    const isSolarInitType = type === FNI_REQUEST_TYPE.SOLAR_INIT;
    const errorEventBy = isSolarInitType ? 'Applicant' : 'Co Applicant';

    let isError = true;
    if (status === HttpStatus.OK) {
      const qualificationExceptionPayload: QualificationExceptionData = {
        qualificationCreditId: qualificationCreditRecordInst._id.toString(),
        errorEvent: {
          by: errorEventBy,
          detail: `Unable to process (${type})`,
        },
      };

      if (!fniResponseData || !fniResponseData.transaction) {
        throw new QualificationException(
          new NotFoundException(`FNI Response to ${type} is undefined or contains no transaction`),
          qualificationExceptionPayload,
        );
      }

      if (!fniResponseData.transaction.refnum) {
        throw new QualificationException(
          new NotFoundException(`FNI Response to ${type} is missing refnum`),
          qualificationExceptionPayload,
        );
      }

      const { transaction, application, field_descriptions, stips } = fniResponseData;

      const activeFniApplicationIdx = qualificationCreditRecordInst.fniApplications.findIndex(
        fniApplication => fniApplication.state === FNI_APPLICATION_STATE.ACTIVE,
      );

      if (activeFniApplicationIdx === -1) {
        throw new QualificationException(
          ApplicationException.ActiveFniApplicationNotFound(qualificationCreditRecordInst._id),
          qualificationExceptionPayload,
        );
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
      const qualificationExceptionPayload: QualificationExceptionData = {
        qualificationCreditId: qualificationCreditRecordInst._id.toString(),
        errorEvent: {
          by: errorEventBy,
          detail: `Unable to send Application for Credit Check (${type})`,
        },
      };

      try {
        this.sendFniErrorEmail(
          status,
          fniResponseData as IFniResponseData,
          type,
          qualificationCreditRecordInst.opportunityId,
        );
      } catch (error) {
        throw new QualificationException(ApplicationException.FniProcessError(), qualificationExceptionPayload);
      } finally {
        throw new QualificationException(ApplicationException.FniProcessError(), qualificationExceptionPayload);
      }
    }
  }

  async handleProcessFniSolarApplyResponse(data: {
    qualificationCreditId: string;
    opportunityId: string;
    fniResponse: IFniResponse;
  }): Promise<string> {
    const { qualificationCreditId, opportunityId, fniResponse } = data;
    const { type, status, data: fniResponseData } = fniResponse;

    const isSolarApplyUpcomingType = type === FNI_REQUEST_TYPE.SOLAR_APPLY_INCOMING;

    const qualificationCredit = await this.qualificationCreditModel.findById(qualificationCreditId);
    if (!qualificationCredit) {
      throw new NotFoundException(`Qualification Credit not found with id ${qualificationCreditId}`);
    }

    let isError = true;
    let responseStatus = APPLICATION_PROCESS_STATUS.APPLICATION_PROCESS_SUCCESS;
    if (status === HttpStatus.OK) {
      const qualificationExceptionPayload: QualificationExceptionData = {
        qualificationCreditId,
        errorEvent: {
          by: 'System',
          detail: isSolarApplyUpcomingType
            ? 'Unable to process incoming Application data'
            : `Unable to process (${type})`,
        },
      };

      if (!fniResponseData || !fniResponseData.transaction) {
        throw new QualificationException(
          new NotFoundException(`FNI Response to ${type} is undefined or contains no transaction`),
          qualificationExceptionPayload,
        );
      }
      const { transaction, application, field_descriptions, stips, product_decisions } = fniResponseData;

      if (!application) {
        throw new QualificationException(
          new NotFoundException(`Application is undefined in FNI Response Data`),
          qualificationExceptionPayload,
        );
      }

      const activeFniApplicationIdx = qualificationCredit.fniApplications.findIndex(
        fniApplication => fniApplication.state === FNI_APPLICATION_STATE.ACTIVE,
      );

      if (activeFniApplicationIdx === -1) {
        throw new QualificationException(
          ApplicationException.ActiveFniApplicationNotFound(qualificationCredit._id),
          qualificationExceptionPayload,
        );
      }

      const activeFniApplication = qualificationCredit.fniApplications[activeFniApplicationIdx];

      const transactionStatus = transaction.status;
      const rawResponse = {
        transaction,
        stips,
        application,
        product_decisions,
        field_descriptions,
      };
      if (transactionStatus === FNI_TRANSACTION_STATUS.ERROR) {
        if (application.currDecision) {
          activeFniApplication.fniCurrentDecision = application.currDecision;
        }
        activeFniApplication.responses ??= [];
        activeFniApplication.responses.push({
          type: FNI_REQUEST_TYPE.SOLAR_APPLY,
          transactionStatus: FNI_TRANSACTION_STATUS.ERROR,
          rawResponse,
          createdAt: new Date(),
        });
      }

      let eventHistoryDetail = EVENT_HISTORY_DETAIL.CREDIT_VALIDATION_ERROR;

      if (transactionStatus === FNI_TRANSACTION_STATUS.SUCCESS) {
        isError = false;
        switch (application.currDecision) {
          case QUALIFICATION_STATUS.APPROVED:
          case QUALIFICATION_STATUS.DECLINED:
          case QUALIFICATION_STATUS.WITHDRAWN:
            qualificationCredit.qualificationStatus = application.currDecision;
            qualificationCredit.processStatus = PROCESS_STATUS.COMPLETED;
            eventHistoryDetail = EVENT_HISTORY_DETAIL.CREDIT_VALIDATION_COMPLETED;
            break;
          case QUALIFICATION_STATUS.PENDING:
          case QUALIFICATION_STATUS.REVIEW:
            qualificationCredit.qualificationStatus = application.currDecision;
            eventHistoryDetail = EVENT_HISTORY_DETAIL.CREDIT_VALIDATION_IN_PROGRESS;
            break;
          default:
            qualificationCredit.qualificationStatus = QUALIFICATION_STATUS.ERROR;
            qualificationCredit.processStatus = PROCESS_STATUS.ERROR;
            eventHistoryDetail = EVENT_HISTORY_DETAIL.CREDIT_VALIDATION_ERROR;
            break;
        }

        if (qualificationCredit.qualificationStatus === QUALIFICATION_STATUS.PENDING && field_descriptions) {
          field_descriptions.map(field =>  activeFniApplication.fniCurrentDecisionReasons.push(field.currQueueName));
        }
        if (application.currDecision) {
          qualificationCredit.milestone = MILESTONE_STATUS.APPLICATION_STATUS;
        }
        activeFniApplication.fniCurrentDecisionReceivedAt = application.timeReceived;
        activeFniApplication.fniCurrentDecision = application.currDecision;
        activeFniApplication.responses ??= [];
        activeFniApplication.responses.push({
          type: FNI_REQUEST_TYPE.SOLAR_APPLY,
          transactionStatus: FNI_TRANSACTION_STATUS.SUCCESS,
          rawResponse,
          createdAt: new Date(),
        });
      }

      const qualificationCategoryType =
        qualificationCredit.type === QUALIFICATION_TYPE.HARD
          ? QUALIFICATION_CATEGORY.HARD_CREDIT
          : QUALIFICATION_CATEGORY.SOFT_CREDIT;

      if (
        !fniResponseData ||
        !fniResponseData.application ||
        fniResponseData.application.currDecision === QUALIFICATION_STATUS.ERROR
      ) {
        responseStatus = APPLICATION_PROCESS_STATUS.APPLICATION_PROCESS_ERROR;
      }

      const applicantTypeInst = qualificationCredit.hasCoApplicant ? 'Applicant and Co-Applicant' : 'Applicant';

      qualificationCredit.eventHistories.push({
        issueDate: new Date(),
        by: applicantTypeInst,
        detail: eventHistoryDetail,
        qualificationCategory: qualificationCategoryType,
      });

      qualificationCredit.fniApplications[activeFniApplicationIdx] = activeFniApplication;

      await this.qualificationCreditModel.updateOne({ _id: qualificationCredit.id }, qualificationCredit);
    }

    if (isError) {
      const qualificationExceptionPayload: QualificationExceptionData = {
        qualificationCreditId,
        errorEvent: {
          by: 'System',
          detail: isSolarApplyUpcomingType
            ? 'Unable to process incoming Application data'
            : `Unable to send Application for Credit Check (${type})`,
        },
      };

      try {
        this.sendFniErrorEmail(status, fniResponseData as IFniResponseData, type, opportunityId);
      } catch (error) {
        throw new QualificationException(ApplicationException.FniProcessError(), qualificationExceptionPayload);
      } finally {
        throw new QualificationException(ApplicationException.FniProcessError(), qualificationExceptionPayload);
      }
    }

    return responseStatus;
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

    const stringsToValidate = [
      req.transaction?.refnum,
      req.application?.currDecision,
      req.application?.productId,
      req.application?.timeReceived,
    ];

    if (
      stringsToValidate.filter(s => !typeof String).length ||
      stringsToValidate.filter(s => s === undefined || s === '').length
    ) {
      return false;
    }

    const currDecisionHasValidValue =
      req.application?.currDecision === 'APPROVED' ||
      req.application?.currDecision === 'DECLINED' ||
      req.application?.currDecision === 'PENDING' ||
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

  private async getEligibleQuotes(opportunityId: string) {
    const foundQuotes = await this.quoteService.getQuotesByCondition({
      opportunityId,
      solver_id: { $ne: null },
      is_sync: true,
      is_archived: false,
    });
    return foundQuotes;
  }

  private sendFniErrorEmail(
    status: number,
    fniResponseData: IFniResponseData,
    type: FNI_REQUEST_TYPE,
    opportunityId: string,
  ): void {
    let subject;
    let message;

    if (status === HttpStatus.OK && fniResponseData!.transaction.status === FNI_TRANSACTION_STATUS.ERROR) {
      subject = this.getFniErrorSubject({ type });
      message = {
        opportunityId,
        transaction: fniResponseData!.transaction,
      };
    } else {
      subject = this.getFniErrorSubject({ type, status });
      message = {
        opportunityId,
      };
    }

    // eslint-disable-next-line no-unused-expressions
    process.env.SUPPORT_MAIL &&
      this.emailService.sendMail(process.env.SUPPORT_MAIL!, JSON.stringify(message), subject).catch(err => {
        console.error(`Send mail error`, err);
      });
  }

  private async decodeCreditQualificationToken(reqMethod, reqBody, token): Promise<ITokenData> {
    const decodedToken: ITokenData = await this.jwtService.decode(token) as ITokenData;
    const tokenStatus = await this.checkToken(token);
    // eslint-disable-next-line default-case
    switch (tokenStatus) {
      case TOKEN_STATUS.EXPIRED:
        throw ApplicationException.ExpiredToken({ responseStatus: 'EXPIRED_TOKEN' });
      case TOKEN_STATUS.INVALID:
        throw new UnauthorizedException();
      case TOKEN_STATUS.VALID: {
        const tokenPayload = await this.jwtService.verifyAsync(token, {
          secret: process.env.QUALIFICATION_JWT_SECRET,
          ignoreExpiration: true,
        });

        if (reqMethod === 'applyCrediQualification') {
          if (tokenPayload.role !== ROLE.SYSTEM || tokenPayload?.contactId !== reqBody?.contactId) {
            throw new UnauthorizedException();
          }

          if (decodedToken.opportunityId !== reqBody?.opportunityId || decodedToken.qualificationCreditId !== reqBody?.qualificationCreditId || decodedToken?.contactId !== reqBody?.contactId) {            
            throw new UnauthorizedException();
          }
        }

        if (reqMethod === 'getApplicationDetail') {
          if (tokenPayload.role !== ROLE.CUSTOMER) {
            throw new UnauthorizedException();
          }
        }
      }
    }
    return decodedToken;
  }
}

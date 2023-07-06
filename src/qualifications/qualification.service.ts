/* eslint-disable no-param-reassign */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, ObjectId } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { PropertyService } from 'src/property/property.service';
import { GetHomeownersByIdResultResDto } from 'src/property/res/get-homeowners-by-id';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { OperationResult } from '../app/common';
import { ContactService } from '../contacts/contact.service';
import { EmailService } from '../emails/email.service';
import { OpportunityService } from '../opportunities/opportunity.service';
import {
  APPLICANT_TYPE,
  APPROVAL_MODE,
  CONSENT_STATUS,
  MILESTONE_STATUS,
  PROCESS_STATUS,
  QUALIFICATION_CATEGORY,
  QUALIFICATION_STATUS,
  QUALIFICATION_TYPE,
  ROLE,
  TOKEN_STATUS,
  VENDOR_ID,
  FNI_APPLICATION_STATE,
} from './constants';
import { IApplicant, QualificationCredit, QUALIFICATION_CREDIT } from './qualification.schema';
import {
  ApplyCreditQualificationReqDto,
  CreateQualificationReqDto,
  GetApplicationDetailReqDto,
  SendMailReqDto,
  SetApplicantConsentReqDto,
  SetManualApprovalReqDto,
} from './req';
import {
  ApplicantConsentDto,
  GetApplicationDetailDto,
  GetQualificationDetailDto,
  ManualApprovalDto,
  QualificationDetailDto,
  SendMailDto,
} from './res';
import { FNI_COMMUNICATION, FNI_Communication } from './schemas/fni-communication.schema';
import { FniEngineService } from './sub-services/fni-engine.service';
import { IFniApplyReq } from './typing.d';
import { getQualificationMilestoneAndProcessStatusByVerbalConsent } from './utils';

@Injectable()
export class QualificationService {
  constructor(
    @InjectModel(QUALIFICATION_CREDIT) private readonly qualificationCreditModel: Model<QualificationCredit>,
    @InjectModel(FNI_COMMUNICATION) private readonly fniCommunicationModel: Model<FNI_Communication>,
    private readonly jwtService: JwtService,
    private readonly opportunityService: OpportunityService,
    private readonly contactService: ContactService,
    private readonly propertyService: PropertyService,
    private readonly emailService: EmailService,
    private readonly fniEngineService: FniEngineService,
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
            fniCommunicationData: [],
          };
        }

        const fniCommunications = await this.fniCommunicationModel
          .find({
            qualificationCreditId: qualificationCredit._id,
          })
          .lean();

        return {
          type,
          qualificationCreditData: qualificationCredit,
          fniCommunicationData: fniCommunications,
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

  async sendMail(req: SendMailReqDto): Promise<OperationResult<SendMailDto>> {
    const qualificationCredit = await this.qualificationCreditModel.findById(req.qualificationCreditId);
    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound(`qualificationCreditId: ${req.qualificationCreditId}`);
    }

    const [opportunity, token] = await Promise.all([
      this.opportunityService.getDetailById(qualificationCredit.opportunityId),
      this.generateToken(qualificationCredit._id, qualificationCredit.opportunityId, ROLE.CUSTOMER),
    ]);

    if (!opportunity) {
      throw ApplicationException.EntityNotFound(`opportunityId: ${qualificationCredit.opportunityId}`);
    }

    const contactId = opportunity.contactId;
    const contact = await this.contactService.getContactById(contactId || '');

    const data = {
      contactFullName:
        `${contact?.firstName || ''}${(contact?.firstName && ' ') || ''}${contact?.lastName || ''}` || 'Customer',
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
    const qualificationCategory =
      qualificationCredit.type === QUALIFICATION_TYPE.HARD
        ? QUALIFICATION_CATEGORY.HARD_CREDIT
        : QUALIFICATION_CATEGORY.SOFT_CREDIT;
    qualificationCredit.eventHistories.push({
      issueDate: now,
      by: req.agentDetail.name,
      detail: 'Email Sent',
      userId: req.agentDetail.userId,
      qualificationCategory,
    });

    qualificationCredit.customerNotifications.push({
      label: 'Applicant',
      type: 'Single Applicant',
      sentOn: now,
      email: contact?.email || '',
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

      let homeowners = null as GetHomeownersByIdResultResDto[] | null;
      if (!applicantIsExist) {
        homeowners = await this.propertyService.findHomeownersById(opportunity.propertyId);
        const contactId = homeowners.find(homeowner => homeowner.isPrimary)?.contactId;
        if (!contactId) {
          throw ApplicationException.EntityNotFound(`Applicant contactId: ${contactId}`);
        }

        const applicant = {} as IApplicant;
        applicant.type = APPLICANT_TYPE.APPLICANT;
        applicant.contactId = contactId;
        qualificationCredit.applicants.push(applicant);
      }

      // type set to coapplicant:
      if (!coApplicantIsExist && qualificationCredit.hasCoApplicant && qualificationCredit.hasCoApplicantConsent) {
        homeowners = homeowners || (await this.propertyService.findHomeownersById(opportunity.propertyId));
        const contactId = homeowners.find(homeowner => !homeowner.isPrimary)?.contactId;
        if (!contactId) {
          throw ApplicationException.EntityNotFound(`Co applicant contactId: ${contactId}`);
        }

        const applicant = {} as IApplicant;
        applicant.type = APPLICANT_TYPE.CO_APPLICANT;
        applicant.contactId = contactId;
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

    const contactId = await this.opportunityService.getContactIdById(qualificationCredit.opportunityId);
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

    const newToken = await this.generateToken(qualificationCreditId, opportunityId, ROLE.SYSTEM);

    return OperationResult.ok(
      strictPlainToClass(GetApplicationDetailDto, {
        qualificationCreditId,
        opportunityId,
        responseStatus: true,
        processStatus: qualificationCredit.processStatus,
        contact,
        newJWTToken: newToken,
      }),
    );
  }

  async applyCreditQualification(
    req: ApplyCreditQualificationReqDto,
  ): Promise<OperationResult<{ responseStatus: string }>> {
    // NOTE: NEVER NEVER NEVER NEVER store the applyCreditQualificationRequestParam or fniApplyRequestInst in the database
    // NOTE: NEVER NEVER NEVER NEVER log the applyCreditQualificationRequestParam or fniApplyRequestInst
    // NOTE: Copy this warning and paste it in the code at the top and bottom of this method

    const tokenStatus = await this.checkToken(req.authenticationToken);
    // eslint-disable-next-line default-case
    switch (tokenStatus) {
      case TOKEN_STATUS.EXPIRED:
        throw ApplicationException.ExpiredToken({ responseStatus: 'EXPIRED_TOKEN' });
      case TOKEN_STATUS.INVALID:
        throw new UnauthorizedException();
      case TOKEN_STATUS.VALID: {
        const tokenPayload = await this.jwtService.verifyAsync(req.authenticationToken, {
          secret: process.env.QUALIFICATION_JWT_SECRET,
          ignoreExpiration: true,
        });

        if (tokenPayload.role !== ROLE.SYSTEM) {
          throw new UnauthorizedException();
        }
      }
    }

    const qualificationCredit = await this.qualificationCreditModel.findById(req.qualificationCreditId);
    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound('Qualification Credit');
    }

    if (qualificationCredit.processStatus !== PROCESS_STATUS.STARTED) {
      return OperationResult.ok({ responseStatus: 'NO_ACTIVE_VALIDATION' });
    }

    const fniApplyRequest = {
      qualificationCreditId: req.qualificationCreditId,
      opportunityId: req.opportunityId,
      primaryApplicantData: {
        firstName: req.primaryApplicantData.firstName,
        middleName: req.primaryApplicantData.middleName,
        lastName: req.primaryApplicantData.lastName,
        email: req.primaryApplicantData.email,
        phoneNumber: req.primaryApplicantData.phoneNumber.match(/\d+/g)?.join(''),
        addressLine1: req.primaryApplicantData.addressLine1,
        addressLine2: req.primaryApplicantData.addressLine2,
        city: req.primaryApplicantData.city,
        state: req.primaryApplicantData.state,
        zipcode: req.primaryApplicantData.zipcode,
      },
      primaryApplicantSecuredData: {
        soc: req.primaryApplicantSecuredData.soc,
        dob: req.primaryApplicantSecuredData.dob,
      },
    } as IFniApplyReq;

    if (req.coApplicantData && req.coApplicantSecuredData) {
      fniApplyRequest.coApplicantData = {
        firstName: req?.coApplicantData?.firstName || '',
        middleName: req?.coApplicantData?.middleName || '',
        lastName: req?.coApplicantData?.lastName || '',
        email: req?.coApplicantData?.email || '',
        phoneNumber: req?.coApplicantData?.phoneNumber.match(/\d+/g)!.join(''),
        addressLine1: req?.coApplicantData?.addressLine1 || '',
        addressLine2: req?.coApplicantData?.addressLine2 || '',
        city: req?.coApplicantData?.city || '',
        state: req?.coApplicantData?.state || '',
        zipcode: req?.coApplicantData?.zipcode,
      };
      fniApplyRequest.coApplicantSecuredData = {
        soc: req?.coApplicantSecuredData?.soc,
        dob: req?.coApplicantSecuredData?.dob || '',
      };
    }

    const qualificationCategory =
      qualificationCredit.type === QUALIFICATION_TYPE.HARD
        ? QUALIFICATION_CATEGORY.HARD_CREDIT
        : QUALIFICATION_CATEGORY.SOFT_CREDIT;
    qualificationCredit.processStatus = PROCESS_STATUS.IN_PROGRESS;
    qualificationCredit.eventHistories.push({
      issueDate: new Date(),
      by: `${req.primaryApplicantData.firstName} ${req.primaryApplicantData.lastName}`,
      detail: 'Application sent for Credit Check',
      qualificationCategory,
    });

    await qualificationCredit.save();
    fniApplyRequest.qualificationCreditId = qualificationCredit._id;

    // ==== FOR DEMO PURPOSE ONLY ====
    // const applyResponse = await this.fniEngineService.apply(fniApplyRequest);
    // const responseStatus = await this.handleFNIResponse(
    //   applyResponse,
    //   `${req.primaryApplicantData.firstName} ${req.primaryApplicantData.lastName}`,
    //   qualificationCredit,
    // );

    const applyResponse = 'SUCCESS';
    const responseStatus = await this.handleFNIResponse(
      applyResponse,
      `${req.primaryApplicantData.firstName} ${req.primaryApplicantData.lastName}`,
      qualificationCredit,
    );
    // ==== FOR DEMO PURPOSE ONLY ====

    return OperationResult.ok({ responseStatus });
  }

  // ==============> INTERNAL <==============

  async generateToken(qualificationCreditId: string, opportunityId: string, role: ROLE): Promise<string> {
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

    return this.jwtService.sign(
      {
        role,
        opportunityId,
        qualificationCreditId,
      },
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

  async getOneById(id: string): Promise<LeanDocument<QualificationCredit> | null> {
    const res = await this.qualificationCreditModel.findById(id).lean();
    return res;
  }

  async countByOpportunityId(opportunityId: string): Promise<number> {
    const counter = await this.qualificationCreditModel.countDocuments({ opportunityId });
    return counter;
  }

  // ===================== INTERNAL =====================
}

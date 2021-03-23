/* eslint-disable no-param-reassign */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as Handlebars from 'handlebars';
import { LeanDocument, Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from '../app/common';
import { ContactService } from '../contacts/contact.service';
import { EmailService } from '../emails/email.service';
import { OpportunityService } from '../opportunities/opportunity.service';
import { APPROVAL_MODE, PROCESS_STATUS, QUALIFICATION_STATUS, ROLE, TOKEN_STATUS, VENDOR_ID } from './constants';
import { QualificationCredit, QUALIFICATION_CREDIT } from './qualification.schema';
import {
  ApplyCreditQualificationReqDto,
  CreateQualificationReqDto,
  GetApplicationDetailReqDto,
  SendMailReqDto,
  SetManualApprovalReqDto,
} from './req';
import {
  GetApplicationDetailDto,
  GetQualificationDetailDto,
  ManualApprovalDto,
  QualificationDto,
  SendMailDto,
} from './res';
import { FNI_COMMUNICATION, FNI_Communication } from './schemas/fni-communication.schema';
import { FniEngineService } from './sub-services/fni-engine.service';
import qualificationTemplate from './template-html/qualification-template';
import { IFniApplyReq } from './typing.d';

@Injectable()
export class QualificationService {
  constructor(
    @InjectModel(QUALIFICATION_CREDIT) private readonly qualificationCreditModel: Model<QualificationCredit>,
    @InjectModel(FNI_COMMUNICATION) private readonly fniCommunicationModel: Model<FNI_Communication>,
    private readonly jwtService: JwtService,
    private readonly opportunityService: OpportunityService,
    private readonly contactService: ContactService,
    private readonly emailService: EmailService,
    private readonly fniEngineService: FniEngineService,
  ) {}

  async createQualification(qualificationDto: CreateQualificationReqDto): Promise<OperationResult<QualificationDto>> {
    const found = await this.qualificationCreditModel.findOne({ opportunity_id: qualificationDto.opportunityId });
    if (found) {
      throw ApplicationException.ExistedEntity('opportunityId', qualificationDto.opportunityId);
    }

    const now = new Date();
    const model = new this.qualificationCreditModel({
      opportunity_id: qualificationDto.opportunityId,
      started_on: now,
      process_status: PROCESS_STATUS.INITIATED,
      event_histories: [
        {
          issue_date: now,
          by: `${qualificationDto.agentDetail.name} - (${qualificationDto.agentDetail.userId})`,
          detail: 'Request Initiated',
        },
      ],
      vendor_id: VENDOR_ID.FNI,
    });
    await model.save();

    return OperationResult.ok(new QualificationDto(model.toObject()));
  }

  async getQualificationDetail(opportunityId: string): Promise<OperationResult<GetQualificationDetailDto>> {
    const qualificationCredit = await this.qualificationCreditModel.findOne({ opportunity_id: opportunityId }).lean();
    if (!qualificationCredit) {
      return OperationResult.ok({
        qualificationCreditData: null,
        qualificationCreditId: '',
        fniCommunicationData: [],
        opportunityId,
      } as any);
    }

    const fniCommunications = await this.fniCommunicationModel
      .find({
        qualification_credit_id: qualificationCredit._id,
      })
      .lean();

    return OperationResult.ok(new GetQualificationDetailDto(qualificationCredit, fniCommunications));
  }

  async setManualApproval(
    id: string,
    manualApprovalDto: SetManualApprovalReqDto,
  ): Promise<OperationResult<ManualApprovalDto>> {
    const now = new Date();
    const qualificationCredit = await this.qualificationCreditModel.findById(id).lean();
    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound(id);
    }

    if (qualificationCredit.process_status !== PROCESS_STATUS.STARTED) {
      return OperationResult.ok(new ManualApprovalDto({ status: false, status_detail: 'NO_ACTIVE_VALIDATION' }));
    }

    qualificationCredit.process_status = PROCESS_STATUS.COMPLETED;
    qualificationCredit.event_histories = [
      ...qualificationCredit.event_histories,
      { issue_date: now, by: manualApprovalDto.agentFullName, detail: 'Credit Check Approved By Agent' },
    ];
    qualificationCredit.approval_mode = APPROVAL_MODE.AGENT;
    qualificationCredit.qualification_status = QUALIFICATION_STATUS.APPROVED;
    qualificationCredit.approved_by = manualApprovalDto.agentUserId;

    await this.qualificationCreditModel.updateOne({ _id: qualificationCredit.id }, qualificationCredit);

    return OperationResult.ok(new ManualApprovalDto({ status: true, status_detail: 'SUCCESS' }, qualificationCredit));
  }

  async sendMail(req: SendMailReqDto): Promise<OperationResult<SendMailDto>> {
    const qualificationCredit = await this.qualificationCreditModel.findById(req.qualificationCreditId).lean();
    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound(req.qualificationCreditId);
    }

    const contactId = await this.opportunityService.getContactIdById(qualificationCredit.opportunity_id);
    const email = await this.contactService.getEmailById(contactId || '');
    const token = await this.generateToken(qualificationCredit._id, qualificationCredit.opportunity_id, ROLE.CUSTOMER);

    const data = {
      customerName: 'Customer',
      qualificationValidityPeriod: '48h',
      recipientNotice: 'No Content',
      qualificationLink: (process.env.QUALIFICATION_PAGE || '').concat(`/${token}`),
    };

    const source = qualificationTemplate;
    const template = Handlebars.compile(source);
    const htmlToSend = template(data);

    await this.emailService.sendMail(email || '', htmlToSend, 'Qualification Invitation');
    const now = new Date();

    qualificationCredit.event_histories = [
      ...qualificationCredit.event_histories,
      { issue_date: now, by: `${req.agentDetail.name} - (${req.agentDetail.userId})`, detail: 'Email Sent' },
    ];

    qualificationCredit.customer_notifications = [
      ...qualificationCredit.customer_notifications,
      {
        sent_on: now,
        email,
      },
    ] as any;

    const res = await this.qualificationCreditModel.findByIdAndUpdate(qualificationCredit.id, qualificationCredit, {
      new: true,
    });

    return OperationResult.ok(new SendMailDto({ status: true, detail: res || ({} as any) }));
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

    const qualificationCredit = await this.qualificationCreditModel.findById(qualificationCreditId).lean();
    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound('Qualification Credit');
    }

    if (![PROCESS_STATUS.INITIATED, PROCESS_STATUS.STARTED].includes(qualificationCredit.process_status)) {
      return OperationResult.ok(
        new GetApplicationDetailDto({
          qualificationCreditId,
          processStatus: qualificationCredit.process_status,
          responseStatus: false,
        }),
      );
    }

    const contactId = await this.opportunityService.getContactIdById(qualificationCredit.opportunity_id);
    const contact = await this.contactService.getContactById(contactId || '');

    qualificationCredit.process_status = PROCESS_STATUS.STARTED;
    qualificationCredit.event_histories = [
      ...qualificationCredit.event_histories,
      {
        issue_date: new Date(),
        by: `${contact?.firstName} ${contact?.lastName}`,
        detail: `Application Started by ${applicationInitatedBy}`,
      },
    ];

    await this.qualificationCreditModel.updateOne({ _id: qualificationCredit._id }, { $set: qualificationCredit });

    const newToken = await this.generateToken(qualificationCreditId, opportunityId, ROLE.SYSTEM);

    return OperationResult.ok(
      new GetApplicationDetailDto({
        qualificationCreditId,
        opportunityId,
        responseStatus: true,
        processStatus: qualificationCredit.process_status,
        primaryApplicantData: {
          firstName: contact?.firstName,
          lastName: contact?.lastName,
          email: contact?.email,
          phoneNumber: contact?.cellPhone,
          addressLine1: contact?.address1,
          addressLine2: contact?.address2,
          city: contact?.city,
          state: contact?.state,
          zipcode: contact?.zip,
        },
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

    const qualificationCredit = await this.qualificationCreditModel.findById(req.qualificationCreditId).lean();
    if (!qualificationCredit) {
      throw ApplicationException.EntityNotFound('Qualification Credit');
    }

    if (qualificationCredit.process_status !== PROCESS_STATUS.STARTED) {
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
        phoneNumber: req.primaryApplicantData.phoneNumber,
        addressLine1: req.primaryApplicantData.addressLine1,
        addressLine2: req.primaryApplicantData.addressLine2,
        city: req.primaryApplicantData.city,
        state: req.primaryApplicantData.state,
        zipcode: req.primaryApplicantData.zipcode,
      },
      coApplicantData: {
        firstName: req?.coApplicantData?.firstName || '',
        middleName: req?.coApplicantData?.middleName || '',
        lastName: req?.coApplicantData?.lastName || '',
        email: req?.coApplicantData?.email || '',
        phoneNumber: req?.coApplicantData?.phoneNumber || '',
        addressLine1: req?.coApplicantData?.addressLine1 || '',
        addressLine2: req?.coApplicantData?.addressLine2 || '',
        city: req?.coApplicantData?.city || '',
        state: req?.coApplicantData?.state || '',
        zipcode: req?.coApplicantData?.zipcode || '',
      },
      primaryApplicantSecuredData: {
        soc: req.primaryApplicantSecuredData.soc,
        dob: req.primaryApplicantSecuredData.dob,
      },
      coApplicantSecuredData: {
        soc: req?.coApplicantSecuredData?.soc || '',
        dob: req?.coApplicantSecuredData?.dob || '',
      },
    } as IFniApplyReq;

    qualificationCredit.process_status = PROCESS_STATUS.IN_PROGRESS;
    qualificationCredit.event_histories = [
      ...qualificationCredit.event_histories,
      {
        issue_date: new Date(),
        by: `${req.primaryApplicantData.firstName} ${req.primaryApplicantData.lastName}`,
        detail: 'Application sent for Credit Check',
      },
    ];

    await this.qualificationCreditModel.updateOne({ _id: qualificationCredit._id }, qualificationCredit);

    fniApplyRequest.qualificationCreditId = qualificationCredit._id;

    const applyResponse = await this.fniEngineService.apply(fniApplyRequest);
    const responseStatus = await this.handleFNIResponse(
      applyResponse,
      `${req.primaryApplicantData.firstName} ${req.primaryApplicantData.lastName}`,
      qualificationCredit,
    );

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

    const found = await this.qualificationCreditModel.findById(qualificationCreditId);
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

    // eslint-disable-next-line default-case
    switch (fniResponse) {
      case 'SUCCESS': {
        applyCreditQualificationResponseStatus = 'APPLICATION_PROCESS_SUCCESS';
        qualificationCreditRecordInst.process_status = PROCESS_STATUS.COMPLETED;
        qualificationCreditRecordInst.event_histories = [
          ...qualificationCreditRecordInst.event_histories,
          { issue_date: new Date(), by: customerNameInst, detail: 'Credit Validation Completed' },
        ];
        qualificationCreditRecordInst.approval_mode = APPROVAL_MODE.CREDIT_VENDOR;
        qualificationCreditRecordInst.qualification_status = QUALIFICATION_STATUS.APPROVED;
        qualificationCreditRecordInst.approved_by = 'SYSTEM';
        break;
      }
      case 'FAILURE': {
        applyCreditQualificationResponseStatus = 'APPLICATION_PROCESS_SUCCESS';
        qualificationCreditRecordInst.process_status = PROCESS_STATUS.COMPLETED;
        qualificationCreditRecordInst.event_histories = [
          ...qualificationCreditRecordInst.event_histories,
          { issue_date: new Date(), by: customerNameInst, detail: 'Credit Validation Completed' },
        ];
        qualificationCreditRecordInst.approval_mode = APPROVAL_MODE.CREDIT_VENDOR;
        qualificationCreditRecordInst.qualification_status = QUALIFICATION_STATUS.DECLINED;
        qualificationCreditRecordInst.approved_by = 'SYSTEM';
        break;
      }
      case 'PENDING': {
        applyCreditQualificationResponseStatus = 'APPLICATION_PROCESS_SUCCESS';
        qualificationCreditRecordInst.process_status = PROCESS_STATUS.IN_PROGRESS;
        qualificationCreditRecordInst.event_histories = [
          ...qualificationCreditRecordInst.event_histories,
          { issue_date: new Date(), by: customerNameInst, detail: 'Credit Validation In Progress' },
        ];
        qualificationCreditRecordInst.approval_mode = APPROVAL_MODE.CREDIT_VENDOR;
        qualificationCreditRecordInst.qualification_status = QUALIFICATION_STATUS.PENDING;
        qualificationCreditRecordInst.approved_by = 'SYSTEM';
        break;
      }
      case 'ERROR': {
        applyCreditQualificationResponseStatus = 'APPLICATION_PROCESS_ERROR';
        return applyCreditQualificationResponseStatus;
      }
    }

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
    const counter = await this.qualificationCreditModel.countDocuments({ opportunity_id: opportunityId });
    return counter;
  }

  // ===================== INTERNAL =====================
}

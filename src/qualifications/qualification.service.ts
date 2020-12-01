import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
import qualificationTemplate from './template-html/qualification-template';

@Injectable()
export class QualificationService {
  constructor(
    @InjectModel(QUALIFICATION_CREDIT) private readonly qualificationCreditModel: Model<QualificationCredit>,
    @InjectModel(FNI_COMMUNICATION) private readonly fniCommunicationModel: Model<FNI_Communication>,
    private readonly jwtService: JwtService,
    private readonly opportunityService: OpportunityService,
    private readonly contactService: ContactService,
    private readonly emailService: EmailService,
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
    const qualificationCredit = await this.qualificationCreditModel.findOne({ opportunity_id: opportunityId });
    if (!qualificationCredit) {
      throw ApplicationException.EnitityNotFound(opportunityId);
    }

    const fniCommunication = await this.fniCommunicationModel.findOne({
      qualification_credit_id: qualificationCredit._id,
    });

    return OperationResult.ok(
      new GetQualificationDetailDto(qualificationCredit.toObject(), fniCommunication && fniCommunication.toObject()),
    );
  }

  async setManualApproval(
    id: string,
    manualApprovalDto: SetManualApprovalReqDto,
  ): Promise<OperationResult<ManualApprovalDto>> {
    const now = new Date();
    const qualificationCredit = await this.qualificationCreditModel.findById(id);
    if (!qualificationCredit) {
      throw ApplicationException.EnitityNotFound(id);
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

    await this.qualificationCreditModel.updateOne({ _id: qualificationCredit.id }, qualificationCredit.toObject());

    return OperationResult.ok(new ManualApprovalDto({ status: true, status_detail: 'SUCCESS' }));
  }

  async sendMail(req: SendMailReqDto): Promise<OperationResult<SendMailDto>> {
    const qualificationCredit = await this.qualificationCreditModel.findById(req.qualificationCreditId);
    if (!qualificationCredit) {
      throw ApplicationException.EnitityNotFound(req.qualificationCreditId);
    }

    const contactId = await this.opportunityService.getContactIdById(qualificationCredit.opportunity_id);
    const email = await this.contactService.getEmailById(contactId);
    const token = this.generateToken(qualificationCredit._id, qualificationCredit.opportunity_id, ROLE.CUSTOMER);

    const data = {
      customerName: 'Customer',
      qualificationValidityPeriod: '48h',
      recipientNotice: 'No Content',
      qualificationLink: process.env.QUALIFICATION_PAGE.concat(`/${token}`),
    };

    const source = qualificationTemplate;
    const template = Handlebars.compile(source);
    const htmlToSend = template(data);

    await this.emailService.sendMail(email, htmlToSend, 'Qualification Invitation');
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
    ];

    const res = await this.qualificationCreditModel.findByIdAndUpdate(
      qualificationCredit.id,
      qualificationCredit.toObject(),
      { new: true },
    );

    return OperationResult.ok(new SendMailDto({ status: true, detail: res }));
  }

  async getApplicationDetail(req: GetApplicationDetailReqDto): Promise<OperationResult<GetApplicationDetailDto>> {
    const tokenStatus = await this.checkToken(req.token);
    switch (tokenStatus) {
      case TOKEN_STATUS.EXPIRED:
        throw ApplicationException.ExpiredToken({ responseStatus: false });
      case TOKEN_STATUS.INVALID:
        throw new UnauthorizedException();
    }

    const qualificationCredit = await this.qualificationCreditModel.findById(req.qualificationCreditId);
    if (qualificationCredit.process_status !== PROCESS_STATUS.INITIATED) {
      return OperationResult.ok(
        new GetApplicationDetailDto({
          qualificationCreditId: req.qualificationCreditId,
          processStatus: qualificationCredit.process_status,
          responseStatus: true,
        }),
      );
    }

    const contactId = await this.opportunityService.getContactIdById(qualificationCredit.opportunity_id);
    const contact = await this.contactService.getContactById(contactId);

    qualificationCredit.process_status = PROCESS_STATUS.STARTED;
    qualificationCredit.event_histories = [
      ...qualificationCredit.event_histories,
      {
        issue_date: new Date(),
        by: `${contact.firstName} ${contact.lastName}`,
        detail: 'Application Started by Customer',
      },
    ];

    await this.qualificationCreditModel.updateOne({ _id: qualificationCredit.id }, qualificationCredit.toObject());

    const newToken = this.generateToken(req.qualificationCreditId, req.opportunityId, ROLE.SYSTEM);

    return OperationResult.ok(
      new GetApplicationDetailDto({
        qualificationCreditId: req.qualificationCreditId,
        responseStatus: true,
        processStatus: qualificationCredit.process_status,
        primaryApplicantData: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phoneNumber: contact.cellPhone,
          addressLine1: contact.address1,
          addressLine2: contact.address2,
          city: contact.city,
          state: contact.state,
          zipcode: contact.zip,
        },
        newJWTToken: newToken,
      }),
    );
  }

  async applyCreditQualification(
    req: ApplyCreditQualificationReqDto,
  ): Promise<OperationResult<{ responseStatus: string }>> {
    //NOTE: NEVER NEVER NEVER NEVER store the applyCreditQualificationRequestParam or fniApplyRequestInst in the database
    //NOTE: NEVER NEVER NEVER NEVER log the applyCreditQualificationRequestParam or fniApplyRequestInst
    //NOTE: Copy this warning and paste it in the code at the top and bottom of this method

    const tokenStatus = await this.checkToken(req.authenticationToken);
    switch (tokenStatus) {
      case TOKEN_STATUS.EXPIRED:
        throw ApplicationException.ExpiredToken({ responseStatus: 'EXPIRED_TOKEN' });
      case TOKEN_STATUS.INVALID:
        throw new UnauthorizedException();
      case TOKEN_STATUS.VALID: {
        const tokenPayload = await this.jwtService.verifyAsync(req.qualificationCreditId, {
          secret: process.env.QUALIFICATION_JWT_SECRET,
          ignoreExpiration: true,
        });

        if (tokenPayload.role !== ROLE.SYSTEM) {
          throw new UnauthorizedException();
        }
      }
    }

    const qualificationCredit = await this.qualificationCreditModel.findById(req.qualificationCreditId);
    if (qualificationCredit.process_status !== PROCESS_STATUS.STARTED) {
      return OperationResult.ok({ responseStatus: 'NO_ACTIVE_VALIDATION' });
    }

    return;
  }

  // ==============> INTERNAL <==============
  generateToken(qualificationCreditId: string, opportunityId: string, role: ROLE): string {
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

    return this.jwtService.sign(
      {
        role,
        opportunityId,
        qualificationCreditId,
      },
      { expiresIn: tokenExpiry },
    );
  }

  async checkToken(token: string) {
    let tokenPayload: any;

    try {
      tokenPayload = await this.jwtService.verifyAsync(token, {
        secret: process.env.QUALIFICATION_JWT_SECRET,
        ignoreExpiration: true,
      });

      if (tokenPayload) {
        try {
          tokenPayload = await this.jwtService.verifyAsync(token, {
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
}

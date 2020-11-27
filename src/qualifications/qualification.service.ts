import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from '../app/common';
import { ContactService } from '../contacts/contact.service';
import { EmailService } from '../emails/email.service';
import { OpportunityService } from '../opportunities/opportunity.service';
import { APPROVAL_MODE, PROCESS_STATUS, QUALIFICATION_STATUS, VENDOR_ID } from './constants';
import { QualificationCredit, QUALIFICATION_CREDIT } from './qualification.schema';
import { CreateQualificationReqDto, SendMailReqDto, SetManualApprovalReqDto } from './req';
import { GetQualificationDetailDto, ManualApprovalDto, SendMailDto } from './res';
import { FNI_COMMUNICATION, FNI_Communication } from './schemas/fni-communication.schema';
import qualificationTemplate from './template-html/qualification-template';

enum ROLE {
  AGENT,
  CUSTOMER,
  SYSTEM,
}

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

  async createQualification(qualificationDto: CreateQualificationReqDto): Promise<OperationResult<ManualApprovalDto>> {
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

    return OperationResult.ok(new ManualApprovalDto(model.toObject()));
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
}

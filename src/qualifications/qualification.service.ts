import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from '../app/common';
import { APPROVAL_MODE, PROCESS_STATUS, QUALIFICATION_STATUS, VENDOR_ID } from './constants';
import { QualificationCredit, QUALIFICATION_CREDIT } from './qualification.schema';
import { CreateQualificationDto, SetManualApprovalDto } from './req';
import { GetQualificationDetailDto, ManualApprovalDto } from './res';
import { FNI_COMMUNICATION, FNI_Communication } from './schemas/fni-communication.schema';

@Injectable()
export class QualificationService {
  constructor(
    @InjectModel(QUALIFICATION_CREDIT) private readonly qualificationCreditModel: Model<QualificationCredit>,
    @InjectModel(FNI_COMMUNICATION) private readonly fniCommunicationModel: Model<FNI_Communication>,
  ) {}

  async createQualification(qualificationDto: CreateQualificationDto): Promise<OperationResult<ManualApprovalDto>> {
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
    manualApprovalDto: SetManualApprovalDto,
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
}

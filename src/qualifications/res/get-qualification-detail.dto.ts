import { ApiProperty } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from '../../app/common';
import { toCamelCase } from '../../utils/transformProperties';
import { APPROVAL_MODE, PROCESS_STATUS, QUALIFICATION_STATUS, VENDOR_ID } from '../constants';
import { QualificationCredit } from '../qualification.schema';
import { FNI_Communication } from './../schemas/fni-communication.schema';
import { FniCommunicationDto } from './sub-dto/fni-communication.dto';

class CustomerNotificationDto {
  @ApiProperty()
  sentOn: Date;

  @ApiProperty()
  email: string;
}

class EventDto {
  @ApiProperty()
  issueDate: Date;

  @ApiProperty()
  by: string;

  @ApiProperty()
  detail: string;
}

class QualificationDetailDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  startedOn: Date;

  @ApiProperty()
  processStatus: PROCESS_STATUS;

  @ApiProperty({ isArray: true, type: CustomerNotificationDto })
  customerNotifications: CustomerNotificationDto[];

  @ApiProperty({ isArray: true, type: EventDto })
  eventHistories: EventDto[];

  @ApiProperty()
  vendorId: VENDOR_ID;

  @ApiProperty()
  approvalMode: APPROVAL_MODE;

  @ApiProperty()
  approvedby: string;

  @ApiProperty()
  qualificationStatus: QUALIFICATION_STATUS;
}

export class GetQualificationDetailDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  qualificationCreditId: string;

  @ApiProperty({ type: QualificationDetailDto })
  qualificationCreditData: QualificationDetailDto;

  @ApiProperty({ type: FniCommunicationDto })
  fniCommunicationData: FniCommunicationDto;

  constructor(qualificationCredit: QualificationCredit, fniCommunication: FNI_Communication) {
    this.opportunityId = qualificationCredit.opportunity_id;
    this.qualificationCreditId = qualificationCredit._id;
    this.qualificationCreditData = this.transformQualificationCreditData(qualificationCredit);
    this.fniCommunicationData = fniCommunication && new FniCommunicationDto(fniCommunication);
  }

  transformQualificationCreditData(props: QualificationCredit): QualificationDetailDto {
    return {
      opportunityId: props.opportunity_id,
      startedOn: props.started_on,
      processStatus: props.process_status,
      customerNotifications: (props.customer_notifications || []).map(item => toCamelCase(item)),
      eventHistories: (props.event_histories || []).map(item => toCamelCase(item)),
      vendorId: props.vendor_id,
      approvalMode: props.approval_mode,
      approvedby: props.approved_by,
      qualificationStatus: props.qualification_status,
    };
  }
}

class GetQualificationPaginationRes implements Pagination<GetQualificationDetailDto> {
  @ApiProperty({
    type: GetQualificationDetailDto,
    isArray: true,
  })
  data: GetQualificationDetailDto[];

  @ApiProperty()
  total: number;
}

export class QualificationDetailListRes implements ServiceResponse<GetQualificationPaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetQualificationPaginationRes })
  data: GetQualificationPaginationRes;
}

export class GetQualificationDetailRes implements ServiceResponse<GetQualificationDetailDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetQualificationDetailDto })
  data: GetQualificationDetailDto;
}

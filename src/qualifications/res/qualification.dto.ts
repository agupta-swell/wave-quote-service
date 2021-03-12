import { ApiProperty } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { Pagination, ServiceResponse } from 'src/app/common';
import { toCamelCase } from 'src/utils/transformProperties';
import { APPROVAL_MODE, PROCESS_STATUS, QUALIFICATION_STATUS, VENDOR_ID } from '../constants';
import { QualificationCredit } from '../qualification.schema';

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
  approvedBy: string;

  @ApiProperty()
  qualificationStatus: QUALIFICATION_STATUS;
}

export class QualificationDto {
  @ApiProperty()
  qualificationId: string;

  @ApiProperty({ type: QualificationDetailDto })
  detail: QualificationDetailDto;

  constructor(props: LeanDocument<QualificationCredit>) {
    this.qualificationId = props._id;
    this.detail = this.transformData(props);
  }

  transformData(props: LeanDocument<QualificationCredit>): QualificationDetailDto {
    return {
      opportunityId: props.opportunity_id,
      startedOn: props.started_on,
      processStatus: props.process_status,
      customerNotifications: (props.customer_notifications || []).map(item => toCamelCase(item)),
      eventHistories: (props.event_histories || []).map(item => toCamelCase(item)),
      vendorId: props.vendor_id,
      approvalMode: props.approval_mode,
      approvedBy: props.approved_by,
      qualificationStatus: props.qualification_status,
    };
  }
}

class QualificationPaginationRes implements Pagination<QualificationDto> {
  @ApiProperty({
    type: QualificationDto,
    isArray: true,
  })
  data: QualificationDto[];

  @ApiProperty()
  total: number;
}

export class QualificationListRes implements ServiceResponse<QualificationPaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: QualificationPaginationRes })
  data: QualificationPaginationRes;
}

export class QualificationRes implements ServiceResponse<QualificationDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: QualificationDto })
  data: QualificationDto;
}

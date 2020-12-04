import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { toCamelCase } from '../../utils/transformProperties';
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

class QualificationDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  qualificationCreditId: string;

  @ApiProperty({ type: QualificationDetailDto })
  qualificationCreditData: QualificationDetailDto;

  constructor(qualificationCredit: QualificationCredit) {
    this.opportunityId = qualificationCredit.opportunity_id;
    this.qualificationCreditId = qualificationCredit._id;
    this.qualificationCreditData = this.transformQualificationCreditData(qualificationCredit);
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
      approvedBy: props.approved_by,
      qualificationStatus: props.qualification_status,
    };
  }
}

interface IProps {
  status: boolean;
  detail: QualificationCredit;
}

export class SendMailDto {
  @ApiProperty()
  status: boolean;

  @ApiProperty({ type: QualificationDto })
  detail: QualificationDto;

  constructor(props: IProps) {
    this.status = props.status;
    this.detail = new QualificationDto(props.detail);
  }
}

export class SendMailRes implements ServiceResponse<SendMailDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: SendMailDto })
  data: SendMailDto;
}

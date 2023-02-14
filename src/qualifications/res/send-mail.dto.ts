import { ServiceResponse } from 'src/app/common';
import { ExposeAndMap, ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { APPROVAL_MODE, PROCESS_STATUS, QUALIFICATION_STATUS, VENDOR_ID } from '../constants';
import { CustomerNotificationDto } from './sub-dto/customer-notification.dto';
import { EventDto } from './sub-dto/event.dto';

class QualificationDetailDto {
  @ExposeProp()
  opportunityId: string;

  @ExposeProp()
  startedOn: Date;

  @ExposeProp()
  processStatus: PROCESS_STATUS;

  @ExposeProp({ isArray: true, type: CustomerNotificationDto })
  customerNotifications: CustomerNotificationDto[];

  @ExposeProp({ isArray: true, type: EventDto })
  eventHistories: EventDto[];

  @ExposeProp()
  vendorId: VENDOR_ID;

  @ExposeProp()
  approvalMode: APPROVAL_MODE;

  @ExposeProp()
  approvedBy: string;

  @ExposeProp()
  qualificationStatus: QUALIFICATION_STATUS;
}

class QualificationDto {
  @ExposeProp()
  opportunityId: string;

  @ExposeMongoId()
  qualificationCreditId: string;

  @ExposeAndMap({ type: QualificationDetailDto }, ({ obj }) => obj)
  qualificationCreditData: QualificationDetailDto;
}

export class SendMailDto {
  @ExposeProp()
  status: boolean;

  @ExposeProp({ type: QualificationDto })
  detail: QualificationDto;
}

export class SendMailRes implements ServiceResponse<SendMailDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: SendMailDto })
  data: SendMailDto;
}

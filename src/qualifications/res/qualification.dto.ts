import { Pagination, ServiceResponse } from 'src/app/common';
import { ExposeAndMap, ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { APPROVAL_MODE, MILESTONE_STATUS, PROCESS_STATUS, QUALIFICATION_STATUS, QUALIFICATION_TYPE, VENDOR_ID } from '../constants';
import { CustomerNotificationDto } from './sub-dto/customer-notification.dto';
import { EventDto } from './sub-dto/event.dto';

export class QualificationDetailDto {
  @ExposeMongoId()
  qualificationId: string;

  @ExposeProp()
  opportunityId: string;

  @ExposeProp()
  type: QUALIFICATION_TYPE;

  @ExposeProp()
  startedOn: Date;

  @ExposeProp()
  milestone: MILESTONE_STATUS;

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

  @ExposeProp()
  hasApplicantConsent: boolean;

  @ExposeProp()
  hasCoApplicantConsent: boolean;

  @ExposeProp()
  hasCoApplicant: boolean;
}

export class QualificationDto {
  @ExposeMongoId()
  qualificationId: string;

  @ExposeAndMap({ type: QualificationDetailDto }, ({ obj }) => obj)
  detail: QualificationDetailDto;
}

class QualificationPaginationRes implements Pagination<QualificationDto> {
  @ExposeProp({
    type: QualificationDto,
    isArray: true,
  })
  data: QualificationDto[];

  @ExposeProp()
  total: number;
}

export class QualificationListRes implements ServiceResponse<QualificationPaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: QualificationPaginationRes })
  data: QualificationPaginationRes;
}

export class QualificationRes implements ServiceResponse<QualificationDetailDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: QualificationDetailDto })
  data: QualificationDetailDto;
}

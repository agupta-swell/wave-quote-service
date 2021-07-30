import { Pagination, ServiceResponse } from 'src/app/common';
import { ExposeAndMap, ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { APPROVAL_MODE, PROCESS_STATUS, QUALIFICATION_STATUS, VENDOR_ID } from '../constants';

class CustomerNotificationDto {
  @ExposeProp()
  sentOn: Date;

  @ExposeProp()
  email: string;
}

class EventDto {
  @ExposeProp()
  issueDate: Date;

  @ExposeProp()
  by: string;

  @ExposeProp()
  detail: string;
}

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

export class QualificationRes implements ServiceResponse<QualificationDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: QualificationDto })
  data: QualificationDto;
}

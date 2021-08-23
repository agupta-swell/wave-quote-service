import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { Pagination, ServiceResponse } from '../../app/common';
import { APPROVAL_MODE, PROCESS_STATUS, QUALIFICATION_STATUS, QUALIFICATION_TYPE, VENDOR_ID } from '../constants';
import { FniCommunicationDto } from './sub-dto/fni-communication.dto';

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
  @ExposeMongoId()
  qualificationId: string;

  @ExposeProp()
  opportunityId: string;

  @ExposeProp()
  type: QUALIFICATION_TYPE;

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
class QualificationDataDto {
  @ExposeProp()
  type: QUALIFICATION_TYPE;

  @ExposeProp({ type: QualificationDetailDto })
  qualificationCreditData: QualificationDetailDto;

  @ExposeProp({ type: FniCommunicationDto, isArray: true })
  fniCommunicationData: FniCommunicationDto[];
}

export class GetQualificationDetailDto {
  @ExposeProp()
  opportunityId: string;

  @ExposeProp({ type: QualificationDataDto, isArray: true })
  qualificationData: QualificationDataDto[];
}

class GetQualificationPaginationRes implements Pagination<GetQualificationDetailDto> {
  @ExposeProp({
    type: GetQualificationDetailDto,
    isArray: true,
  })
  data: GetQualificationDetailDto[];

  @ExposeProp()
  total: number;
}

export class QualificationDetailListRes implements ServiceResponse<GetQualificationPaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetQualificationPaginationRes })
  data: GetQualificationPaginationRes;
}

export class GetQualificationDetailRes implements ServiceResponse<GetQualificationDetailDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetQualificationDetailDto })
  data: GetQualificationDetailDto;
}

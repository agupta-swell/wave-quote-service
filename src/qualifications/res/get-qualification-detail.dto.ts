import { ExposeProp } from 'src/shared/decorators';
import { Pagination, ServiceResponse } from '../../app/common';
import { QUALIFICATION_TYPE } from '../constants';
import { QualificationDetailDto } from './qualification.dto';

class QualificationDataDto {
  @ExposeProp()
  type: QUALIFICATION_TYPE;

  @ExposeProp({ type: QualificationDetailDto })
  qualificationCreditData: QualificationDetailDto;
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

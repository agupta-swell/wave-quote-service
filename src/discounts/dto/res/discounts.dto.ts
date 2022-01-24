import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { Pagination, ServiceResponse } from '../../../app/common';

export class DiscountResDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  name: string;

  @ExposeProp()
  amount: number;

  @ExposeProp()
  type: string;

  @ExposeProp()
  startDate: Date;

  @ExposeProp()
  endDate: Date;

  @ExposeProp()
  cogsAllocation: number;

  @ExposeProp()
  marginAllocation: number;

  @ExposeProp()
  cogsAmount: number;

  @ExposeProp()
  marginAmount: number;
}

class PaginationRes implements Pagination<DiscountResDto> {
  @ExposeProp({
    type: DiscountResDto,
    isArray: true,
  })
  data: DiscountResDto[];

  @ExposeProp()
  total: number;
}

export class DiscountListRes implements ServiceResponse<PaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: PaginationRes })
  data: PaginationRes;
}

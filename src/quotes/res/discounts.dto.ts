import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { Pagination, ServiceResponse } from '../../app/common';

export class DiscountsDto {
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
}

class PaginationRes implements Pagination<DiscountsDto> {
  @ExposeProp({
    type: DiscountsDto,
    isArray: true,
  })
  data: DiscountsDto[];

  @ExposeProp()
  total: number;
}

export class DiscountListRes implements ServiceResponse<PaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: PaginationRes })
  data: PaginationRes;
}

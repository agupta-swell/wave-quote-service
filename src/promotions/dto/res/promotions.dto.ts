import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { Pagination, ServiceResponse } from '../../../app/common';

export class PromotionResDto {
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

class PaginationRes implements Pagination<PromotionResDto> {
  @ExposeProp({
    type: PromotionResDto,
    isArray: true,
  })
  data: PromotionResDto[];

  @ExposeProp()
  total: number;
}

export class PromotionListRes implements ServiceResponse<PaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: PaginationRes })
  data: PaginationRes;
}

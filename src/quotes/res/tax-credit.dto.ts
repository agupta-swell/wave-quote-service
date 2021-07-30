import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { Pagination, ServiceResponse } from '../../app/common';

export class TaxCreditDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  name: string;

  @ExposeProp()
  percentage: number;

  @ExposeProp()
  startDate: Date;

  @ExposeProp()
  endDate: Date;
}

class TaxCreditPaginationRes implements Pagination<TaxCreditDto> {
  @ExposeProp({
    type: TaxCreditDto,
    isArray: true,
  })
  data: TaxCreditDto[];

  @ExposeProp()
  total: number;
}

export class TaxCreditListRes implements ServiceResponse<TaxCreditPaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: TaxCreditPaginationRes })
  data: TaxCreditPaginationRes;
}

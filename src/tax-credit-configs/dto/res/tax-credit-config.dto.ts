import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { Pagination, ServiceResponse } from 'src/app/common';

export class TaxCreditConfigResDto {
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

class TaxCreditConfigPaginationRes implements Pagination<TaxCreditConfigResDto> {
  @ExposeProp({
    type: TaxCreditConfigResDto,
    isArray: true,
  })
  data: TaxCreditConfigResDto[];

  @ExposeProp()
  total: number;
}

export class TaxCreditConfigListRes implements ServiceResponse<TaxCreditConfigPaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: TaxCreditConfigPaginationRes })
  data: TaxCreditConfigPaginationRes;
}

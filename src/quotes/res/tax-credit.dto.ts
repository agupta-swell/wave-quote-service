import { ApiProperty } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from '../../app/common';
import { TaxCreditConfig } from '../schemas/tax-credit-config.schema';

export class TaxCreditDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  taxCreditPrecentage: number;

  @ApiProperty()
  taxCreditStartDate: Date;

  @ApiProperty()
  taxCreditEndDate: Date;

  constructor(props: TaxCreditConfig) {
    this.id = props._id;
    this.name = props.name;
    this.taxCreditPrecentage = props.tax_credit_precentage;
    this.taxCreditStartDate = props.tax_credit_start_date;
    this.taxCreditEndDate = props.tax_credit_end_date;
  }
}

class TaxCreditPaginationRes implements Pagination<TaxCreditDto> {
  @ApiProperty({
    type: TaxCreditDto,
    isArray: true,
  })
  data: TaxCreditDto[];

  @ApiProperty()
  total: number;
}

export class TaxCreditListRes implements ServiceResponse<TaxCreditPaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: TaxCreditPaginationRes })
  data: TaxCreditPaginationRes;
}

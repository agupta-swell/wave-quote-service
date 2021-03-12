import { ApiProperty } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { Pagination, ServiceResponse } from '../../app/common';
import { TaxCreditConfig } from '../schemas/tax-credit-config.schema';

export class TaxCreditDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  constructor(props: LeanDocument<TaxCreditConfig>) {
    this.id = props._id;
    this.name = props.name;
    this.percentage = props.percentage;
    this.startDate = props.start_date;
    this.endDate = props.end_date;
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

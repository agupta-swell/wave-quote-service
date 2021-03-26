import { ApiProperty } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from '../../app/common';
import { Discounts } from '../schemas/discounts.schema';
// import { LeanDocument } from 'mongoose';

export class DiscountsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  amount: Number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  constructor(props: Discounts) {
    this.id = props._id;
    this.name = props.name;
    this.type = props.type;
    this.amount = props.amount;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
  }
}

class PaginationRes implements Pagination<DiscountsDto> {
  @ApiProperty({
    type: DiscountsDto,
    isArray: true,
  })
  data: DiscountsDto[];

  @ApiProperty()
  total: number;
}

export class DiscountListRes implements ServiceResponse<PaginationRes> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: PaginationRes })
  data: PaginationRes;
}

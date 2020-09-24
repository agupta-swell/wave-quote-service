import { ApiProperty } from '@nestjs/swagger';

export class CashProductAttributesDto {
  @ApiProperty()
  upfrontPayment: number;

  @ApiProperty()
  balance: number;

  //FIXME: need to implement later
  @ApiProperty()
  milestonePayment: any;

  @ApiProperty()
  currentAverageMonthlyBill: number;

  @ApiProperty()
  newAverageMonthlyBill: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class EsaProductAttributesDto {
  @ApiProperty()
  @IsNumber()
  upfrontPayment: number;

  @ApiProperty()
  @IsNumber()
  balance: number;

  // FIXME: need to implement later
  @ApiProperty()
  milestonePayment: any;

  @ApiProperty()
  @IsNumber()
  currentAverageMonthlyBill: number;

  @ApiProperty()
  @IsNumber()
  newAverageMonthlyBill: number;
}

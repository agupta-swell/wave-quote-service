import { ApiProperty } from '@nestjs/swagger';
import { ExposeProp } from 'src/shared/decorators';

export class CashProductAttributesDto {
  @ExposeProp()
  upfrontPayment: number;

  @ExposeProp()
  balance: number;

  // FIXME: need to implement later
  @ExposeProp()
  milestonePayment: any;

  @ExposeProp()
  currentAverageMonthlyBill: number;

  @ExposeProp()
  newAverageMonthlyBill: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { PAYMENT_TYPE } from 'src/e-commerces/constants';

class PaymentDetailDataDto {
  @ApiProperty()
  monthlyPaymentAmount: number;

  @ApiProperty()
  savingsFiveYear: number;

  @ApiProperty()
  savingTwentyFiveYear: number;

  @ApiProperty()
  deposit: number;
}

export class PaymentOptionDataDto {
  @ApiProperty({ enum: PAYMENT_TYPE })
  paymentType: PAYMENT_TYPE;

  @ApiProperty({ type: PaymentDetailDataDto })
  paymentDetail: PaymentDetailDataDto;
}

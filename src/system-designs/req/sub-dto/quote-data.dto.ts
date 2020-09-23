import { ApiProperty } from '@nestjs/swagger';

class DiscountDetailDataDto {
  @ApiProperty()
  amount: number;

  @ApiProperty()
  description: number;
}

export class QuoteDataDto {
  @ApiProperty()
  cost: number;

  @ApiProperty()
  markup: number;

  @ApiProperty({ type: () => DiscountDetailDataDto })
  discountDetails: DiscountDetailDataDto;
}

import { ApiProperty } from '@nestjs/swagger';
import { ENERGY_SERVICE_TYPE } from 'src/e-commerces/constants';

class QuoteDetailDataDto {
  @ApiProperty()
  monthlyCost: number;

  @ApiProperty()
  pricePerKwh: number;

  @ApiProperty()
  pricePerKwhWithStorage: number;

  @ApiProperty()
  estimatedIncrease: number;

  @ApiProperty()
  estimatedBillInTenYears: number;

  @ApiProperty()
  cumulativeSavingsOverTwentyFiveYears: number;
}

export class CostDetailDataDto {
  @ApiProperty({ enum: ENERGY_SERVICE_TYPE })
  energyServiceType: ENERGY_SERVICE_TYPE;

  @ApiProperty({ type: QuoteDetailDataDto })
  quoteDetail: QuoteDetailDataDto;
}

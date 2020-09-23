import { ApiProperty } from '@nestjs/swagger';
import { RoofTopDataReqDto } from 'src/system-designs/req';
import { CalculatedQuoteDetailDto, QuoteFinanceProductDto } from './sub-dto';

export class SystemProductionDto {
  @ApiProperty()
  capacityKW: number;

  @ApiProperty()
  generationKWh: number;

  @ApiProperty()
  productivity: number;

  @ApiProperty()
  annualUsageKWh: number;

  @ApiProperty()
  offsetPercentage: number;
}

export class CreateQuoteDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  systemDesignId: string;

  @ApiProperty({ type: () => RoofTopDataReqDto })
  solarDesign: RoofTopDataReqDto;

  @ApiProperty({ type: () => SystemProductionDto })
  systemProduction: SystemProductionDto;

  //FIXME: need to implement later
  @ApiProperty()
  utilityProgram: any;

  @ApiProperty({ type: () => QuoteFinanceProductDto })
  quoteFinanceProduct: QuoteFinanceProductDto;

  @ApiProperty({ type: () => CalculatedQuoteDetailDto })
  calculatedQuoteDetails: CalculatedQuoteDetailDto;
}

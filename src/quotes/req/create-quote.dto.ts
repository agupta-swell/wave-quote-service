import { ApiProperty } from '@nestjs/swagger';
import { QUOTE_MODE_TYPE } from '../constants';

export class QuotePricePerWatt {
  @ApiProperty()
  pricePerWatt: number;

  @ApiProperty()
  grossPrice: number;
}

export class QuotePriceOverride {
  @ApiProperty()
  grossPrice: number;
}

export class CreateQuoteDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  systemDesignId: string;

  @ApiProperty()
  fundingSourceId: string;

  @ApiProperty()
  utilityProgramId: string;

  @ApiProperty()
  quoteName: string;

  @ApiProperty()
  partnerId: string;

  @ApiProperty({ enum: QUOTE_MODE_TYPE, isArray: true })
  allowedQuoteModes: QUOTE_MODE_TYPE[];

  @ApiProperty()
  selectedQuoteMode: string;

  @ApiProperty({ type: QuotePricePerWatt })
  quotePricePerWatt: QuotePricePerWatt;

  @ApiProperty({ type: QuotePriceOverride })
  quotePriceOverride: QuotePriceOverride;
}

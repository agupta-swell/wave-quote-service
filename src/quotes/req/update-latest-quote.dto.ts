import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';
import { QuoteFinanceProductDto } from '.';
import { QUOTE_MODE_TYPE } from '../constants';
import { QuotePriceOverride, QuotePricePerWatt } from './create-quote.dto';

export class UpdateLatestQuoteDto {
  @ApiProperty()
  @IsString()
  opportunityId: string;

  @ApiProperty()
  @IsMongoId()
  systemDesignId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fundingSourceId: string;

  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  financialProductId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  quoteName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  partnerId: string;

  @ApiProperty({ enum: QUOTE_MODE_TYPE, isArray: true })
  @IsEnum(QUOTE_MODE_TYPE, { each: true })
  @IsOptional()
  allowedQuoteModes: QUOTE_MODE_TYPE[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  selectedQuoteMode: string;

  @ApiProperty({ type: QuotePricePerWatt })
  @ValidateNested()
  @Type(() => QuotePricePerWatt)
  quotePricePerWatt: QuotePricePerWatt;

  @ApiProperty({ type: QuotePriceOverride })
  @ValidateNested()
  @Type(() => QuotePriceOverride)
  quotePriceOverride: QuotePriceOverride;

  @ApiProperty({ type: QuoteFinanceProductDto })
  @Type(() => QuoteFinanceProductDto)
  @IsOptional()
  @ValidateNested()
  quoteFinanceProduct: QuoteFinanceProductDto;
}

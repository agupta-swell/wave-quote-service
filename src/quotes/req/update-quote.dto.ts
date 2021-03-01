import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString,
} from 'class-validator';
import { QUOTE_MODE_TYPE } from '../constants';
import { QuotePriceOverride, QuotePricePerWatt } from './create-quote.dto';
import { QuoteCostBuildupDto, QuoteFinanceProductDto, SavingsDetailsDto } from './sub-dto';

class TaxCreditDto {
  @ApiProperty()
  @IsString()
  taxCreditConfigDataId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  percentage: number;
}

export class UpdateQuoteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  opportunityId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  systemDesignId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  quoteName: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isSelected: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isSolar: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isRetrofit: boolean;

  @ApiPropertyOptional({ type: () => QuoteCostBuildupDto })
  @Type(() => QuoteCostBuildupDto)
  @IsOptional()
  quoteCostBuildup: QuoteCostBuildupDto;

  @ApiPropertyOptional({ type: QuoteFinanceProductDto })
  @Type(() => QuoteFinanceProductDto)
  @IsOptional()
  quoteFinanceProduct: QuoteFinanceProductDto;

  @ApiPropertyOptional({ type: SavingsDetailsDto, isArray: true })
  @Type(() => SavingsDetailsDto)
  @IsOptional()
  savingsDetails: SavingsDetailsDto[];

  @ApiProperty()
  @IsBoolean()
  isSync: boolean;

  @ApiProperty({ type: TaxCreditDto, isArray: true })
  @Type(() => TaxCreditDto)
  @IsNotEmpty()
  @IsArray()
  taxCreditData: TaxCreditDto[];

  @ApiProperty()
  utilityProgramSelectedForReinvestment: boolean;

  @ApiProperty()
  taxCreditSelectedForReinvestment: boolean;

  @ApiProperty({ enum: QUOTE_MODE_TYPE, isArray: true })
  allowedQuoteModes: QUOTE_MODE_TYPE[];

  @ApiProperty()
  selectedQuoteMode: string;

  @ApiProperty({ type: QuotePricePerWatt })
  quotePricePerWatt: QuotePricePerWatt;

  @ApiProperty({ type: QuotePriceOverride })
  quotePriceOverride: QuotePriceOverride;
}

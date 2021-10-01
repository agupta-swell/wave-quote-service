import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';
import { QUOTE_MODE_TYPE } from '../constants';

export class QuotePricePerWatt {
  @ApiProperty()
  @IsNumber()
  pricePerWatt: number;

  @ApiProperty()
  @IsNumber()
  grossPrice: number;
}

export class QuotePriceOverride {
  @ApiProperty()
  @IsNumber()
  grossPrice: number;
}

export class CreateQuoteDto {
  @ApiProperty()
  @IsString()
  opportunityId: string;

  @ApiProperty()
  @IsMongoId()
  systemDesignId: string;

  @ApiProperty()
  @IsString()
  fundingSourceId: string;

  @ApiProperty()
  @IsMongoId()
  financialProductId: string;

  @ApiProperty()
  @ValidateIf((_, value) => value)
  @IsMongoId()
  utilityProgramId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  rebateProgramId: string;

  @ApiProperty()
  @IsString()
  quoteName: string;

  @ApiProperty()
  @IsString()
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
}

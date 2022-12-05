import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { PRIMARY_QUOTE_TYPE } from 'src/quotes/constants';

export class UpdateProposalSectionMasterDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({ type: String, isArray: true })
  @IsArray()
  @IsOptional()
  applicableFundingSources: string[];

  @ApiPropertyOptional({ enum: PRIMARY_QUOTE_TYPE, isArray: true })
  @IsArray()
  @IsEnum(PRIMARY_QUOTE_TYPE, { each: true })
  @IsOptional()
  applicableQuoteTypes: PRIMARY_QUOTE_TYPE[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  componentName: string;
}

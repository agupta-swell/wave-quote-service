import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateProposalSectionMasterDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({ type: String, isArray: true })
  @IsArray()
  @IsOptional()
  applicableFundingSources: string[];

  @ApiPropertyOptional({ type: String, isArray: true })
  @IsArray()
  @IsOptional()
  applicableQuoteTypes: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  componentName: string;
}

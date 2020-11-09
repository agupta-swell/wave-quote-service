import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateProposalSectionMasterDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  proposalSectionName: string;

  @ApiPropertyOptional({ type: String, isArray: true })
  @IsArray()
  @IsOptional()
  applicableFinancialProducts: string[];

  @ApiPropertyOptional({ type: String, isArray: true })
  @IsArray()
  @IsOptional()
  applicableProducts: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  componentName: string;
}

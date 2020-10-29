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
  applicableFinancialProduct: string[];

  @ApiPropertyOptional({ type: String, isArray: true })
  @IsArray()
  @IsOptional()
  applicableProduct: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  componentName: string;
}

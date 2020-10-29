import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateProposalSectionMasterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  proposalSectionName: string;

  @ApiProperty({ type: String, isArray: true })
  @IsArray()
  @IsNotEmpty()
  applicableFinancialProduct: string[];

  @ApiProperty({ type: String, isArray: true })
  @IsArray()
  @IsNotEmpty()
  applicableProduct: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  componentName: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class ProposalSectionMasterDto {
  @ApiProperty()
  applicableFinancialProduct: string;

  @ApiProperty({ type: String, isArray: true })
  applicableProducts: string[];
}

export class CreateProposalTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ isArray: true })
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  sections: string[];

  @ApiProperty({ type: ProposalSectionMasterDto })
  @ValidateNested({ each: true })
  proposalSectionMaster: ProposalSectionMasterDto;
}

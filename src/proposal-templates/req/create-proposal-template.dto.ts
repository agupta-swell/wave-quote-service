import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

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

  @ApiProperty({ type: String, isArray: true })
  @IsArray()
  @IsNotEmpty()
  sections: string[];

  @ApiProperty({ type: ProposalSectionMasterDto })
  proposalSectionMaster: ProposalSectionMasterDto;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { ProposalSectionMasterDto } from './create-proposal-template.dto';

export class UpdateProposalTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({ isArray: true })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  sections: string[];

  @ApiProperty({ type: ProposalSectionMasterDto })
  @ValidateNested()
  proposalSectionMaster: ProposalSectionMasterDto;

  @IsNotEmpty()
  @ApiProperty()
  description: string;
}

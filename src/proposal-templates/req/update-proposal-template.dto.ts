import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { ProposalSectionMasterDto } from './create-proposal-template.dto';

export class UpdateProposalTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  name: string;

  @ApiPropertyOptional({ type: String, isArray: true })
  @IsOptional()
  sections: string[];

  @ApiProperty({ type: ProposalSectionMasterDto })
  proposalSectionMaster: ProposalSectionMasterDto;
}

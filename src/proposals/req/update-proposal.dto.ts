import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { RecipientDto } from './create-proposal.dto';

class DetailedProposalDto {
  @ApiProperty()
  isSelected: boolean;

  @ApiProperty()
  proposalName: string;

  @ApiProperty({ type: RecipientDto, isArray: true })
  recipients: RecipientDto[];

  @ApiProperty()
  proposalValidityPeriod: number;

  @ApiProperty()
  templateId: string;
}

export class UpdateProposalDto {
  @ApiProperty()
  @IsNotEmpty()
  opportunityId: string;

  @ApiProperty()
  @IsNotEmpty()
  systemDesignId: string;

  @ApiProperty()
  @IsNotEmpty()
  quoteId: string;

  @ApiProperty({ type: DetailedProposalDto })
  detailedProposal: DetailedProposalDto;
}

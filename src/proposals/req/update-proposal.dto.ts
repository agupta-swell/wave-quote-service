import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { RecepientDto } from './create-proposal.dto';

class DetailedProposalDto {
  @ApiProperty()
  isSelected: boolean;

  @ApiProperty()
  proposalName: string;

  @ApiProperty({ type: RecepientDto, isArray: true })
  recipients: RecepientDto[];

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

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class RecipientDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;
}

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

export class CreateProposalDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  @IsNotEmpty()
  systemDesignId: string;

  @ApiProperty()
  proposalName: string;

  @ApiProperty()
  @IsNotEmpty()
  quoteId: string;

  @ApiProperty({ type: DetailedProposalDto })
  detailedProposal: DetailedProposalDto;
}

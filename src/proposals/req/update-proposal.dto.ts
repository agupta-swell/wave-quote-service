import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

class RecepientDto {
  email: string;
  name: string;
}

class DetailedProposalDto {
  @ApiProperty()
  isSelected: boolean;

  @ApiProperty()
  proposalName: string;

  @ApiProperty({ type: RecepientDto })
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

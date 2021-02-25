import { ApiProperty } from '@nestjs/swagger';
import { RecipientDto } from './create-proposal.dto';

export class UpdateProposalDto {
  @ApiProperty()
  isSelected: boolean;

  @ApiProperty()
  proposalName: string;

  @ApiProperty({ type: RecipientDto, isArray: true })
  recipients: RecipientDto[];

  @ApiProperty()
  proposalValidityPeriod: number;

  @ApiProperty()
  pdfFileUrl: string;

  @ApiProperty()
  htmlFileUrl: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class RecipientDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;
}

export class CreateProposalDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  proposalName: string;

  @ApiProperty({ type: RecipientDto, isArray: true })
  recipients: RecipientDto[];
}

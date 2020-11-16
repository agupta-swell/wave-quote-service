import { ApiProperty } from '@nestjs/swagger';

export class RecepientDto {
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

  @ApiProperty({ type: RecepientDto, isArray: true })
  recipients: RecepientDto[];
}

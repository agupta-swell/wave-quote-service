import { ApiProperty } from '@nestjs/swagger';

export class CreateProposalDto {
  @ApiProperty()
  opportunityId: string;
}

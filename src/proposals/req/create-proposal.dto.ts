import { ApiProperty } from '@nestjs/swagger';
import { IRecipientSchema } from '../proposal.schema';

export class CreateProposalDto {
  @ApiProperty()
  opportunityId: string;

  @ApiProperty()
  proposalName: string;

  @ApiProperty()
  recipients: IRecipientSchema[];
}

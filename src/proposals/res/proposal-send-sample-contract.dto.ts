import { ApiProperty } from '@nestjs/swagger';

export class ProposalSendSampleContractDto {
  @ApiProperty()
  url: string;
}

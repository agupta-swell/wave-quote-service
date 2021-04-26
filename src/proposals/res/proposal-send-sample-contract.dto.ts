import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';

export class ProposalSendSampleContractResultDto {
  @ApiProperty()
  url: string;
}

export class ProposalSendSampleContractRes implements ServiceResponse<ProposalSendSampleContractResultDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: ProposalSendSampleContractResultDto })
  data: ProposalSendSampleContractResultDto;
}

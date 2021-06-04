import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';

export class ProposalSendSampleContractResultDto {
  @ExposeProp()
  url: string;
}

export class ProposalSendSampleContractRes implements ServiceResponse<ProposalSendSampleContractResultDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: ProposalSendSampleContractResultDto })
  data: ProposalSendSampleContractResultDto;
}

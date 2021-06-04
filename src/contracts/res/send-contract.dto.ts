import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';
import { ContractResDto } from './sub-dto';

export class SendContractDto {
  @ExposeProp()
  status: string;

  @ExposeProp()
  statusDescription: string;

  @ExposeProp({ type: ContractResDto })
  newlyUpdatedContract: ContractResDto | null;
}

export class SendContractRes implements ServiceResponse<SendContractDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: SendContractDto })
  data: SendContractDto;
}

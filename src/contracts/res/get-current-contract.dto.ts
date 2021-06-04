import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';
import { ContractResDto } from './sub-dto';


class ContractDetailDataResDto {
  @ExposeProp({ type: ContractResDto })
  contractData: ContractResDto;

  @ExposeProp({ type: ContractResDto, isArray: true })
  changeOrders: ContractResDto[];
}

export class GetCurrentContractDto {
  @ExposeProp({ type: ContractDetailDataResDto, isArray: true })
  contracts: ContractDetailDataResDto[];
}

export class GetCurrentContractRes implements ServiceResponse<GetCurrentContractDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: GetCurrentContractDto })
  data: GetCurrentContractDto;
}

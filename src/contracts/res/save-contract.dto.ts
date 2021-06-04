import { IsString } from 'class-validator';
import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';
import { ContractResDto } from './sub-dto';

export class SaveContractDto {
  @ExposeProp()
  status: boolean;

  @ExposeProp()
  statusDescription: string | undefined;

  @ExposeProp({ type: ContractResDto, required: false })
  newlyUpdatedContract?: ContractResDto;
}

export class SendContractReq {
  @ExposeProp()
  @IsString()
  contractId: string;
}

export class SaveContractRes implements ServiceResponse<SaveContractDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: SaveContractDto })
  data: SaveContractDto;
}

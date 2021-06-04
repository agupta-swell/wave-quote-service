import { ServiceResponse } from 'src/app/common';
import { ExposeProp } from 'src/shared/decorators';
import { ContractResDto } from './sub-dto';

export class SaveChangeOrderDto {
  @ExposeProp()
  status = true;

  @ExposeProp()
  statusDescription: string;

  @ExposeProp({ type: ContractResDto, required: false })
  newlyUpdatedContract?: ContractResDto;
}

export class SaveChangeOrderRes implements ServiceResponse<SaveChangeOrderDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: SaveChangeOrderDto })
  data: SaveChangeOrderDto;
}

import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { Contract } from '../contract.schema';
import { ContractResDto } from './sub-dto';

export class SaveContractDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  statusDescription: string;

  @ApiProperty({ type: ContractResDto })
  newlyUpdatedContract: ContractResDto;

  constructor(status: string, statusDescription: string, contract: Contract) {
    this.status = status;
    this.statusDescription = statusDescription;
    this.newlyUpdatedContract = new ContractResDto(contract);
  }
}

export class SaveContractRes implements ServiceResponse<SaveContractDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: SaveContractDto })
  data: SaveContractDto;
}

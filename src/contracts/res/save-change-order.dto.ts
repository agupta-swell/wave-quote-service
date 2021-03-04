import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { Contract } from '../contract.schema';
import { ContractResDto } from './sub-dto';

export class SaveChangeOrderDto {
  @ApiProperty()
  status: boolean;

  @ApiProperty()
  statusDescription: string;

  @ApiPropertyOptional({ type: ContractResDto })
  newlyUpdatedContract?: ContractResDto;

  constructor(status: boolean, statusDescription?: string, contract?: Contract) {
    this.status = status;
    this.statusDescription = statusDescription ?? '';
    this.newlyUpdatedContract = contract && new ContractResDto(contract);
  }
}

export class SaveChangeOrderRes implements ServiceResponse<SaveChangeOrderDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: SaveChangeOrderDto })
  data: SaveChangeOrderDto;
}

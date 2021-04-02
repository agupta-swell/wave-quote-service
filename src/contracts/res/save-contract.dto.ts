import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { LeanDocument } from 'mongoose';
import { ServiceResponse } from 'src/app/common';
import { Contract } from '../contract.schema';
import { ContractResDto } from './sub-dto';

export class SaveContractDto {
  @ApiProperty()
  status: boolean;

  @ApiProperty()
  statusDescription: string | undefined;

  @ApiPropertyOptional({ type: ContractResDto })
  newlyUpdatedContract?: ContractResDto;

  constructor(status: boolean, statusDescription?: string | undefined, contract?: LeanDocument<Contract>) {
    this.status = status;
    this.statusDescription = statusDescription;
    this.newlyUpdatedContract = contract && new ContractResDto(contract);
  }
}

export class SendContractReq {
  @ApiProperty()
  @IsString()
  contractId: string;
}

export class SaveContractRes implements ServiceResponse<SaveContractDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: SaveContractDto })
  data: SaveContractDto;
}

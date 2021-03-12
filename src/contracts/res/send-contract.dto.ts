import { ApiProperty } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { ServiceResponse } from 'src/app/common';
import { Contract } from '../contract.schema';
import { ContractResDto } from './sub-dto';

export class SendContractDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  statusDescription: string;

  @ApiProperty({ type: ContractResDto })
  newlyUpdatedContract: ContractResDto | null;

  constructor(status: string, statusDescription: string, contract: LeanDocument<Contract> | null) {
    this.status = status;
    this.statusDescription = statusDescription;
    this.newlyUpdatedContract = contract && new ContractResDto(contract);
  }
}

export class SendContractRes implements ServiceResponse<SendContractDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: SendContractDto })
  data: SendContractDto;
}

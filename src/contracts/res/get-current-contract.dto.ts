import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { toCamelCase } from 'src/utils/transformProperties';
import { Contract } from '../contract.schema';
import { ContractResDto } from './sub-dto';

interface IGetCurrentContractDto {
  contractData: Contract;
  changeOrders: Contract[];
}

class ContractDetailDataResDto {
  @ApiProperty({ type: ContractResDto })
  contractData: ContractResDto;

  @ApiProperty({ type: ContractResDto, isArray: true })
  changeOrders: ContractResDto[];
}

export class GetCurrentContractDto {
  @ApiProperty({ type: ContractDetailDataResDto, isArray: true })
  contracts: ContractDetailDataResDto[];

  constructor(props: IGetCurrentContractDto[]) {
    this.contracts = props.map((item) => this.transformData(item));
  }

  transformData(contract: IGetCurrentContractDto): ContractDetailDataResDto {
    return {
      contractData: new ContractResDto(contract.contractData),
      changeOrders: contract.changeOrders.map((changeOrder) => new ContractResDto(changeOrder)),
    };
  }
}

export class GetCurrentContractRes implements ServiceResponse<GetCurrentContractDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: GetCurrentContractDto })
  data: GetCurrentContractDto;
}

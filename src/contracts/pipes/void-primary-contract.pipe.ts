import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { CONTRACT_TYPE, PROCESS_STATUS } from '../constants';
import { Contract } from '../contract.schema';
import { ContractService } from '../contract.service';

@Injectable()
export class VoidPrimaryContractPipe implements PipeTransform<ObjectId, Promise<Contract>> {
  constructor(private readonly contractService: ContractService) {}

  async transform(value: ObjectId): Promise<Contract> {
    const foundContract = await this.contractService.getOneByContractId(value);

    VoidPrimaryContractPipe.validate(foundContract);

    return foundContract;
  }

  private static validate(contract: Contract) {
    if (![CONTRACT_TYPE.PRIMARY_CONTRACT, CONTRACT_TYPE.GRID_SERVICES_AGREEMENT].includes(contract.contractType)) {
      throw new BadRequestException('This contract is not allowed to void');
    }

    if (contract.contractStatus === PROCESS_STATUS.VOIDED) {
      throw new BadRequestException('This contract has already been voided');
    }
  }
}

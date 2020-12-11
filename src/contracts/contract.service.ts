import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { CONTRACT_TYPE } from './constants';
import { Contract, CONTRACT } from './contract.schema';
import { GetCurrentContractDto } from './res';

@Injectable()
export class ContractService {
  constructor(@InjectModel(CONTRACT) private readonly contractModel: Model<Contract>) {}

  async getCurrentContracts(opportunityId: string): Promise<OperationResult<GetCurrentContractDto>> {
    const primaryContractRecords = await this.contractModel.find({
      opportunity_id: opportunityId,
      contract_type: CONTRACT_TYPE.PRIMARY,
    });

    const data = await Promise.all(
      primaryContractRecords?.map(async contract => {
        const changeOrders = await this.contractModel.find({
          opportunity_id: opportunityId,
          contract_type: CONTRACT_TYPE.CHANGE_ORDER,
          primary_contract_id: contract.id,
        });

        return {
          contractData: contract?.toObject({ versionKey: false }),
          changeOrders: changeOrders?.map(item => item?.toObject({ versionKey: false })) || [],
        };
      }),
    );

    return OperationResult.ok(new GetCurrentContractDto(data));
  }
}

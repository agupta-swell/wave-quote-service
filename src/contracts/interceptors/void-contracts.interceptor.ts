import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OperationResult, ServiceResponse } from 'src/app/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { ContractService } from '../contract.service';
import { Contract } from '../contract.schema';
import { SaveContractDto } from '../res';
import { PROCESS_STATUS } from '../constants';

@Injectable()
export class VoidRelatedContractsInterceptor implements NestInterceptor {
  constructor(private readonly contractService: ContractService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    return this.voidCOContracts(next);
  }

  private voidCOContracts(handler: CallHandler): Observable<any> {
    return handler.handle().pipe(
      map(async (res: Contract) => {
        const { _id } = res;

        const relatedContracts = await this.contractService.getCOContractsByPrimaryContractId(_id.toString());

        await Promise.all(relatedContracts.map(c => this.contractService.voidContract(c)));

        const result = ServiceResponse.fromResult(
          OperationResult.ok(strictPlainToClass(SaveContractDto, { status: true, newlyUpdatedContract: res })),
        );

        result.data.newlyUpdatedContract.contractStatus = PROCESS_STATUS.VOIDED;

        return result;
      }),
    );
  }
}

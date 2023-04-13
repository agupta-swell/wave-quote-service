import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OperationResult } from 'src/app/common';
import { CONTRACT_TYPE } from 'src/contracts/constants';
import { SaveChangeOrderDto, SaveContractDto } from 'src/contracts/res';
import { InstalledProductService } from '../installed-product.service';

@Injectable()
export class ReplaceInstalledProductsInterceptor implements NestInterceptor {
  constructor(private readonly installedProductService: InstalledProductService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<OperationResult<SaveChangeOrderDto | SaveContractDto>>,
  ): Observable<any> {
    return next.handle().pipe(
      map(async res => {
        const req = context.switchToHttp().getRequest();

        const { userId } = req.user;

        const { data } = res;

        if (!data || !data.newlyUpdatedContract) return res;

        if (data.newlyUpdatedContract.contractType === CONTRACT_TYPE.GRID_SERVICES_PACKET) return res;

        const { opportunityId } = data.newlyUpdatedContract;

        const systemDesign = await this.installedProductService.getSystemDesign(data.newlyUpdatedContract);

        if (!systemDesign) {
          return res;
        }

        await this.installedProductService.updateLatestProductData(
          opportunityId,
          userId,
          Object.keys(systemDesign.capacityProductionDesignData ?? {}).length
            ? systemDesign.capacityProductionDesignData
            : systemDesign.roofTopDesignData,
        );
        return res;
      }),
    );
  }
}

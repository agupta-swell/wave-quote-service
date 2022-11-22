import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { LeanDocument } from 'mongoose';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OperationResult } from 'src/app/common';
import { CONTRACT_TYPE } from 'src/contracts/constants';
import { SaveChangeOrderDto, SaveContractDto } from 'src/contracts/res';
import { ContractResDto } from 'src/contracts/res/sub-dto';
import { QuoteService } from 'src/quotes/quote.service';
import { SystemDesign } from 'src/system-designs/system-design.schema';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { InstalledProductService } from '../installed-product.service';

@Injectable()
export class ReplaceInstalledProductsInterceptor implements NestInterceptor {
  constructor(
    private readonly quoteService: QuoteService,
    private readonly systemDesignService: SystemDesignService,
    private readonly installedProductService: InstalledProductService,
  ) {}

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

        const systemDesign = await this.getSystemDesign(data.newlyUpdatedContract);

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

  private async getSystemDesign(contract: ContractResDto): Promise<LeanDocument<SystemDesign> | null> {
    if (contract.systemDesignId) {
      const systemDesign = await this.systemDesignService.getOneById(contract.systemDesignId);

      if (!systemDesign) {
        console.info(
          `Something went wrong, can not find system design ${contract.systemDesignId} in contract ${contract.id}`,
        );

        return null;
      }

      return systemDesign;
    }

    const { id, associatedQuoteId } = contract;

    const quote = await this.quoteService.getOneFullQuoteDataById(associatedQuoteId);

    if (!quote) {
      console.info(`Something went wrong, can not find quote ${associatedQuoteId} in contract ${id}`);
      return null;
    }

    const systemDesign = await this.systemDesignService.getOneById(quote.systemDesignId);

    if (!systemDesign) {
      console.info(
        `Something went wrong, can not find system design ${quote.systemDesignId} in quote ${associatedQuoteId} - contract ${id}`,
      );

      return null;
    }

    return systemDesign;
  }
}

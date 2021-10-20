import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OperationResult } from 'src/app/common';
import { CONTRACT_TYPE } from 'src/contracts/constants';
import { SaveChangeOrderDto, SaveContractDto } from 'src/contracts/res';
import { QuoteService } from 'src/quotes/quote.service';
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

        if (data.newlyUpdatedContract.contractType === CONTRACT_TYPE.GRID_SERVICES_AGREEMENT) return res;

        const { opportunityId, id, associatedQuoteId } = data.newlyUpdatedContract;

        const quote = await this.quoteService.getOneFullQuoteDataById(associatedQuoteId);

        if (!quote) {
          console.info(`Something went wrong, can not find quote ${associatedQuoteId} in contract ${id}`);
          return res;
        }

        const systemDesign = await this.systemDesignService.getOneById(quote.systemDesignId);

        if (!systemDesign) {
          console.info(
            `Something went wrong, can not find system design ${quote.systemDesignId} in quote ${associatedQuoteId} - contract ${id}`,
          );

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

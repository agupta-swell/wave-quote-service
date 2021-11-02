import { ILeaseProductAttributes } from 'src/quotes/quote.schema';
import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabValue,
} from 'src/shared/docusign';
import { IGenericObject } from '../../typing';

@DefaultTabTransformation('snake_case')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DocusignTemplate('demo', 'c40d9d52-08ba-4c12-9ad2-9f781fb354b4')
export class AdditionalTermEsaDataTemplate {
  @TabValue<IGenericObject>(({ quote }) => quote.quoteFinanceProduct.financeProduct.productAttribute.newPricePerKWh)
  pricePerKwh: number;

  @TabValue<IGenericObject>(
    ({ quote }) => (<ILeaseProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).rateEscalator,
  )
  rateEscalator: number;

  @TabValue<IGenericObject>(
    ({ quote }) =>
      (<ILeaseProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).leaseSolverConfigSnapshot
        ?.storagePayment,
  )
  monthlyStoragePayment: number | undefined;
}

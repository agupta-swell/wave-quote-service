import { IEsaProductAttributes, ILeaseProductAttributes } from 'src/quotes/quote.schema';
import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabLabel,
  TabValue,
} from 'src/shared/docusign';
import { IGenericObject } from '../../typing';

@DocusignTemplate('demo', 'c40d9d52-08ba-4c12-9ad2-9f781fb354b4')
@DocusignTemplate('live', '72f299d9-0745-40ed-afa7-92e0e2ffd075')
@DefaultTabTransformation('snake_case')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class AdditionalTermEsaDataTemplate {
  @TabValue<IGenericObject>(({ quote }) => quote.quoteFinanceProduct.financeProduct.productAttribute.newPricePerKWh)
  pricePerKwh: number;

  @TabValue<IGenericObject>(
    ({ quote }) => (<IEsaProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).rateEscalator,
  )
  esaEsclator: number;

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

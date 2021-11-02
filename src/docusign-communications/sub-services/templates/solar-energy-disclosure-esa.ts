import { ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { DefaultTabType, DocusignTemplate, DOCUSIGN_TAB_TYPE, TabDynamic } from 'src/shared/docusign';
import { numberWithCommas } from 'src/utils/transformNumber';
import { IGenericObject } from '../../typing';

@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DocusignTemplate('demo', '5a055d9b-e744-4f94-a5b1-ef6b5ae4108c')
export class SolarEnergyDisclosureEsaDataTemplate {
  @TabDynamic<IGenericObject>(genericObject => {
    const leaseProduct = genericObject?.quote?.quoteFinanceProduct?.financeProduct
      ?.productAttribute as ILeaseProductAttributes;

    const obj = {} as any;
    if (leaseProduct) {
      obj.price_per_kwh = leaseProduct.newPricePerKWh?.toFixed(3) || 0;
      obj.rate_escalator = leaseProduct.rateEscalator?.toFixed(2) || 0;
      obj.down_payment = numberWithCommas(leaseProduct.upfrontPayment || 0, 2);
    }
    return obj;
  })
  dynamicTabs: unknown;
}

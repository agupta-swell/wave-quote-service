import { ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { numberWithCommas } from 'src/utils/transformNumber';
import { TemplateDataBuilder } from '../../typing';

export const getSolarEnergyDisclosureEsaData: TemplateDataBuilder = (genericObject) => {
  const leaseProduct = genericObject?.quote?.quoteFinanceProduct?.financeProduct
    ?.productAttribute as ILeaseProductAttributes;

  const obj = {} as any;
  if (leaseProduct) {
    obj.price_per_kwh = leaseProduct.newPricePerKWh?.toFixed(3) || 0;
    obj.rate_escalator = leaseProduct.rateEscalator?.toFixed(2) || 0;
    obj.down_payment = numberWithCommas(leaseProduct.upfrontPayment || 0, 2) ;
  }
  return obj;

};

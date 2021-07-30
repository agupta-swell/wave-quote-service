import { ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { TemplateDataBuilder } from '../../typing';

export const getSolarEnergyDisclosureEsaData: TemplateDataBuilder = (genericObject) => {
  const leaseProduct = genericObject?.quote?.quoteFinanceProduct?.financeProduct
    ?.productAttribute as ILeaseProductAttributes;

  const obj = {} as any;
  if (leaseProduct) {
    obj['YR1_COST/kWh'] = leaseProduct.monthlyLeasePayment + leaseProduct.monthlyEnergyPayment;
    obj.ESA_ESC = leaseProduct.rateEscalator;
    obj.DOWN_PMT = leaseProduct.upfrontPayment;
  }
  return obj;
};

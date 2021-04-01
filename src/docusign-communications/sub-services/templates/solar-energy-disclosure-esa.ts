import { ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { TemplateDataBuilder } from '../../typing';

export const getSolarEnergyDisclosureEsaData: TemplateDataBuilder = (genericObject) => {
  const leaseProduct = genericObject?.quote?.quote_finance_product?.finance_product
    ?.product_attribute as ILeaseProductAttributes;

  const obj = {} as any;
  if (leaseProduct) {
    obj['YR1_COST/kWh'] = leaseProduct.monthly_lease_payment + leaseProduct.monthly_energy_payment;
    obj.ESA_ESC = leaseProduct.rate_escalator;
    obj.DOWN_PMT = leaseProduct.upfront_payment;
  }
  return obj;
};

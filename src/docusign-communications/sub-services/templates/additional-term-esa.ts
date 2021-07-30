import { ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { TemplateDataBuilder } from '../../typing';

export const getAdditionalTermEsaData: TemplateDataBuilder = (genericObject) => {
  const leaseProduct = genericObject?.quote?.quoteFinanceProduct?.financeProduct
    ?.productAttribute as ILeaseProductAttributes;
  const obj = {} as any;
  if (leaseProduct) {
    obj.ESA_ESC = leaseProduct.rateEscalator;
  }
  return obj;
};

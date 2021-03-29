import { ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { TemplateDataBuilder } from '../../typing';

export const getAdditionalTermEsaData: TemplateDataBuilder = (genericObject, defaultContractor) => {
  const leaseProduct = genericObject?.quote?.quote_finance_product?.finance_product
    ?.product_attribute as ILeaseProductAttributes;
  const obj = {} as any;
  if (leaseProduct) {
    obj.ESA_ESC = leaseProduct.rate_escalator;
  }
  return obj;
};

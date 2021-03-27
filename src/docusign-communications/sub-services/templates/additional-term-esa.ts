import { ILeaseProductAttributes } from 'src/quotes/quote.schema';

// TODO: consider this parameter type. As now, I assume below type

export function getAddtionalTermEsaData(leaseProduct: ILeaseProductAttributes) {
  const obj = {} as any;
  obj.ESA_ESC = leaseProduct.rate_escalator;

  return obj;
}

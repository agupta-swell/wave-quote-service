import { ILeaseProductAttributes } from 'src/quotes/quote.schema';

// TODO: consider this parameter type. As now, I assume below type

export function getSolarEnergyDisclosureEsaData(leaseProduct: ILeaseProductAttributes) {
  const obj = {} as any;
  obj['YR1_COST/kWh'] = leaseProduct.monthly_lease_payment + leaseProduct.monthly_energy_payment;
  obj['ESA ESC'] = leaseProduct.rate_escalator;
  obj.DOWN_PMT = leaseProduct.upfront_payment;

  return obj;
}

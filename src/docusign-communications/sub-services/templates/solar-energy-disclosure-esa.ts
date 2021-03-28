import { TemplateDataBuilder } from '../../typing';

// TODO: fix typing
// @ts-ignore
export const getSolarEnergyDisclosureEsaData: TemplateDataBuilder = ({ leaseProduct }) => ({
  'YR1_COST/kWh': leaseProduct.monthly_lease_payment + leaseProduct.monthly_energy_payment,
  'ESA ESC': leaseProduct.rate_escalator,
  'DOWN_PMT': leaseProduct.upfront_payment,
});

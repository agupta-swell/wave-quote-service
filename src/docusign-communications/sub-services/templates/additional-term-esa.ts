import { ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { TemplateDataBuilder } from '../../typing';

export const getAdditionalTermEsaData: TemplateDataBuilder = ({ quote, leaseSolverConfig }) => {
  return {
    price_per_kwh: `${quote.quoteFinanceProduct.financeProduct.productAttribute.newPricePerKWh}`,
    rate_escalator: `${
      (<ILeaseProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).rateEscalator
    }`,
    storage_payment: `${
      (<ILeaseProductAttributes>quote.quoteFinanceProduct.financeProduct.productAttribute).leaseSolverConfigSnapshot
        ?.storagePayment
    }`,
  };
};

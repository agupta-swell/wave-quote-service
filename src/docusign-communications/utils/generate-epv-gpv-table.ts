/* eslint-disable no-plusplus */
import { IDetailedQuoteSchema, IEsaProductAttributes, ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { ISystemProductionSchema } from 'src/system-designs/system-design.schema';

interface IGenerateEPVAndGPVTableParams {
  systemProduction: ISystemProductionSchema;
  quote: IDetailedQuoteSchema;
}

export const generateEPVAndGPVTable = ({ systemProduction, quote }: IGenerateEPVAndGPVTableParams) => {
  const { generationKWh } = systemProduction;
  const { annualDegradation = 0, guaranteedProduction = 0 } = quote.quoteFinanceProduct.financialProductSnapshot ?? {};
  const { leaseTerm, yearlyLeasePaymentDetails = [] } = quote.quoteFinanceProduct.financeProduct
    .productAttribute as ILeaseProductAttributes;

  const EPV_YLD: number[] = [generationKWh];
  const EPV_YLD_CUM: number[] = [generationKWh];

  const GPV_YLD: number[] = [(generationKWh * guaranteedProduction) / 100];
  const GUARANTEED_PV_PRICE_PER_KWH: number[] = [
    (yearlyLeasePaymentDetails[0]?.monthlyPaymentDetails[0]?.paymentAmount * 12) / generationKWh,
  ];

  for (let index = 1; index < leaseTerm; index++) {
    EPV_YLD[index] = EPV_YLD[index - 1] * (1 - annualDegradation / 100);
    EPV_YLD_CUM[index] = EPV_YLD_CUM[index - 1] + EPV_YLD[index];
    GPV_YLD[index] = (EPV_YLD[index] * guaranteedProduction) / 100;
    GUARANTEED_PV_PRICE_PER_KWH[index] =
      (yearlyLeasePaymentDetails[index]?.monthlyPaymentDetails[0]?.paymentAmount * 12) / EPV_YLD[index];
  }

  return {
    EPV_YLD,
    EPV_YLD_CUM,
    GPV_YLD,
    GUARANTEED_PV_PRICE_PER_KWH,
  };
};

export const generateEPVAndGPVTableForESA = ({ systemProduction, quote }: IGenerateEPVAndGPVTableParams) => {
  const { generationKWh } = systemProduction;
  const { annualDegradation = 0, guaranteedProduction = 0 } =
    quote.quoteFinanceProduct.financeProduct.financialProductSnapshot ?? {};
  const { esaTerm, grossFinancePayment, rateEscalator } = quote.quoteFinanceProduct.financeProduct
    .productAttribute as IEsaProductAttributes;

  const EPV_YLD: number[] = [generationKWh];
  const EPV_YLD_CUM: number[] = [generationKWh];

  const GPV_YLD: number[] = [(generationKWh * guaranteedProduction) / 100];
  const GUARANTEED_PV_PRICE_PER_KWH: number[] = generationKWh ? [(grossFinancePayment * 12) / generationKWh] : [0];

  for (let index = 1; index < esaTerm; index++) {
    EPV_YLD[index] = EPV_YLD[index - 1] * (1 - annualDegradation / 100);
    EPV_YLD_CUM[index] = EPV_YLD_CUM[index - 1] + EPV_YLD[index];
    GPV_YLD[index] = (EPV_YLD[index] * guaranteedProduction) / 100;
    GUARANTEED_PV_PRICE_PER_KWH[index] = GPV_YLD[index]
      ? (12 * grossFinancePayment * (1 + rateEscalator / 100) ** index) / GPV_YLD[index]
      : 0;
  }

  return {
    EPV_YLD,
    EPV_YLD_CUM,
    GPV_YLD,
    GUARANTEED_PV_PRICE_PER_KWH,
  };
};

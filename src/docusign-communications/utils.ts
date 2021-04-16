import { IDetailedQuoteSchema, ILeaseProductAttributes } from 'src/quotes/quote.schema';
import { ISystemProductionSchema } from 'src/system-designs/system-design.schema';

interface IGenerateEPVAndGPVTableParams {
  systemProduction: ISystemProductionSchema;
  quote: IDetailedQuoteSchema;
}

export const generateEPVAndGPVTable = ({ systemProduction, quote }: IGenerateEPVAndGPVTableParams) => {
  const { generationKWh } = systemProduction;
  const { annual_degradation, guaranteed_production } = quote.quote_finance_product.financial_product_snapshot;
  const { lease_term, yearly_lease_payment_details } = quote.quote_finance_product.finance_product
    .product_attribute as ILeaseProductAttributes;

  const EPV_YLD: number[] = [generationKWh];
  const EPV_YLD_CUM: number[] = [generationKWh];

  const GPV_YLD: number[] = [(generationKWh * guaranteed_production) / 100];
  const GUARANTEED_PV_PRICE_PER_KWH: number[] = [
    (yearly_lease_payment_details[0].monthly_payment_details[0].payment_amount * 12) / generationKWh,
  ];

  for (let index = 1; index < lease_term; index++) {
    EPV_YLD[index] = EPV_YLD[index - 1] * (1 - annual_degradation / 100);
    EPV_YLD_CUM[index] = EPV_YLD_CUM[index - 1] + EPV_YLD[index];
    GPV_YLD[index] = (EPV_YLD[index] * guaranteed_production) / 100;
    GUARANTEED_PV_PRICE_PER_KWH[index] =
      (yearly_lease_payment_details[index].monthly_payment_details[0].payment_amount * 12) / EPV_YLD[index];
  }

  return {
    EPV_YLD,
    EPV_YLD_CUM,
    GPV_YLD,
    GUARANTEED_PV_PRICE_PER_KWH,
  };
};

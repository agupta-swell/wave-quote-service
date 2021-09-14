import { TemplateDataBuilder } from '../../typing';

export const getDummyGSA: TemplateDataBuilder = ({ financialProduct, quote }) => {
  if (!financialProduct) {
    return {};
  }

  return {
    FinancierName: financialProduct.countersignerName,
    FinancierTitle: financialProduct.countersignerTitle,
  } as any;
};

import { TemplateDataBuilder } from '../../typing';

export const getDummyChangeOrder: TemplateDataBuilder = ({ financialProduct }) => {
  if (!financialProduct) {
    return {};
  }

  return {
    FinancierTitle: financialProduct.countersignerTitle,
  } as any;
};

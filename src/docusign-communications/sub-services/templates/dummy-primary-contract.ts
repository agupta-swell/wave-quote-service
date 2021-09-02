import { TemplateDataBuilder } from '../../typing';

export const getDummyPrimaryContract: TemplateDataBuilder = ({ financialProduct }) => {
  if (!financialProduct) {
    return {};
  }

  return {
    FinancierTitle: financialProduct.countersignerTitle,
  } as any;
};

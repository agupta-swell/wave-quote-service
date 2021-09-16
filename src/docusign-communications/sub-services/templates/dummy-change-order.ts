import { sumBy } from 'lodash';
import { TemplateDataBuilder } from '../../typing';

export const getDummyChangeOrder: TemplateDataBuilder = ({ financialProduct, contract, quote }) => {
  const { quoteCostBuildup } = quote;

  const { panelQuoteDetails, inverterQuoteDetails, storageQuoteDetails, ancillaryEquipmentDetails } = quoteCostBuildup;

  if (!financialProduct) {
    return {};
  }

  const panelSummary = panelQuoteDetails
    .map(panel => `  • ${panel.quantity} x ${panel.panelModelDataSnapshot.name}`)
    .join('\n');

  const inverterSummary = inverterQuoteDetails
    .map(inverter => `  • ${inverter.quantity} x ${inverter.inverterModelDataSnapshot.name}`)
    .join('\n');

  const storageSummary = storageQuoteDetails
    .map(storage => `  • ${storage.quantity} x ${storage.storageModelDataSnapshot.name}`)
    .join('\n');

  const ancillarySummary = ancillaryEquipmentDetails
    .map(ancillary => `  • ${ancillary.quantity} x ${ancillary.ancillaryEquipmentModelDataSnapshot.modelName}`)
    .join('\n');

  return {
    PV_KW:
      `System Size:` +
      sumBy(quoteCostBuildup.panelQuoteDetails, item => item.panelModelDataSnapshot.sizeW * item.quantity) / 1000,
    ES_KWH:
      `Battery kWh:` +
      sumBy(quoteCostBuildup.storageQuoteDetails, item => item.storageModelDataSnapshot.sizekWh * item.quantity),
    ES_KW:
      `Battery kW:` +
      sumBy(quoteCostBuildup.storageQuoteDetails, item => item.storageModelDataSnapshot.sizeW * item.quantity) / 1000,
    FinancierName: financialProduct.countersignerName,
    FinancierTitle: financialProduct.countersignerTitle,
    ProductSummary: ['Product Summary:', panelSummary, inverterSummary, storageSummary, ancillarySummary]
      .filter(item => !!item)
      .join('\n'),
    ChangeOrderDescription: 'Change Order description:\n' + (contract!.changeOrderDescription ?? ''),
  } as any;
};

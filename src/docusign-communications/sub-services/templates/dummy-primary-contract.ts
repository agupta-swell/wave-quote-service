import { sumBy } from 'lodash';
import { TabLabel, TabValue, DocusignTemplate, PrefillTab, TextTab } from 'src/shared/docusign';
import { IGenericObject } from '../../typing';

@DocusignTemplate('demo', '67aa9e1d-aaef-46db-8f70-e23f392a10b2')
export class DummyPrimaryContractTemplate {
  @TextTab()
  @TabLabel('DUMMY_PRIM_TEXT')
  @TabValue('This is dummy prim text value')
  dummyPrimText: string;

  @PrefillTab()
  @TabLabel('PV_KW')
  @TabValue<IGenericObject>(
    ctx =>
      `System size: ${
        sumBy(
          ctx.quote.quoteCostBuildup.panelQuoteDetails,
          item => item.panelModelDataSnapshot.ratings.watts * item.quantity,
        ) / 1000
      }`,
  )
  pvKW: string;

  @PrefillTab()
  @TabLabel('ES_KWH')
  @TabValue<IGenericObject>(
    ctx =>
      `Battery kWh: ${sumBy(
        ctx.quote.quoteCostBuildup.storageQuoteDetails,
        item => item.storageModelDataSnapshot.ratings.kilowattHours * item.quantity,
      )}`,
  )
  esKWh: string;

  @PrefillTab()
  @TabLabel('ES_KW')
  @TabValue<IGenericObject>(
    ctx =>
      `Battery kW: ${sumBy(
        ctx.quote.quoteCostBuildup.storageQuoteDetails,
        item => item.storageModelDataSnapshot.ratings.kilowatts * item.quantity,
      )}`,
  )
  esKw: string;

  @PrefillTab()
  @TabLabel('FinancierName')
  @TabValue<IGenericObject>(ctx => ctx.financialProduct?.countersignerName)
  financierName: string;

  @PrefillTab()
  @TabLabel('FinancierTitle')
  @TabValue<IGenericObject>(ctx => ctx.financialProduct?.countersignerTitle)
  financierTitle: string;

  @PrefillTab()
  @TabLabel('ProductSummary')
  @TabValue<IGenericObject>(ctx => {
    const { quoteCostBuildup } = ctx.quote;
    const {
      panelQuoteDetails,
      inverterQuoteDetails,
      storageQuoteDetails,
      ancillaryEquipmentDetails,
    } = quoteCostBuildup;

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
      .map(ancillary => `  • ${ancillary.quantity} x ${ancillary.ancillaryEquipmentModelDataSnapshot.name}`)
      .join('\n');

    return ['Product Summary:', panelSummary, inverterSummary, storageSummary, ancillarySummary]
      .filter(item => !!item)
      .join('\n');
  })
  productSummary: string;
}

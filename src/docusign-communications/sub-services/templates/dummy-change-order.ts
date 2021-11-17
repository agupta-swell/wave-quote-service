import { sumBy } from 'lodash';
import {
  DefaultTabTransformation,
  DefaultTabType,
  DocusignTemplate,
  DOCUSIGN_TAB_TYPE,
  TabLabel,
  TabValue,
} from 'src/shared/docusign';
import { IGenericObject } from '../../typing';

@DocusignTemplate('demo', 'f880c5fa-28eb-4b63-b974-3e5290792ef9')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DefaultTabTransformation('pascal_case')
export class DummyChangeOrderTemplate {
  @TabValue<IGenericObject>(ctx => ctx.financialProduct?.countersignerName)
  financierName: string;

  @TabValue<IGenericObject>(ctx => ctx.financialProduct?.countersignerTitle)
  financierTitle: string;

  @TabValue<IGenericObject>(({ contract }) => 'Change Order description:\n' + (contract!.changeOrderDescription ?? ''))
  changeOrderDescription: string;

  @TabLabel('PV_KW')
  @TabValue<IGenericObject>(
    ({ quote: { quoteCostBuildup } }) =>
      `System Size:` +
      sumBy(quoteCostBuildup.panelQuoteDetails, item => item.panelModelDataSnapshot.ratings.watts * item.quantity) /
        1000,
  )
  pvKw: string;

  @TabLabel('ES_KW')
  @TabValue<IGenericObject>(
    ({ quote: { quoteCostBuildup } }) =>
      `Battery kW:` +
      sumBy(
        quoteCostBuildup.storageQuoteDetails,
        item => item.storageModelDataSnapshot.ratings.kilowatts * item.quantity,
      ),
  )
  esKw: string;

  @TabLabel('ES_KWH')
  @TabValue<IGenericObject>(
    ({ quote: { quoteCostBuildup } }) =>
      `Battery kWh:` +
      sumBy(
        quoteCostBuildup.storageQuoteDetails,
        item => item.storageModelDataSnapshot.ratings.kilowattHours * item.quantity,
      ),
  )
  esKWh: string;

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

import { sumBy } from 'lodash';
import { ISystemDesignProducts, parseSystemDesignProducts } from 'src/docusign-communications/utils';
import { DefaultTabType, DocusignTemplate, DOCUSIGN_TAB_TYPE, TabDynamic } from 'src/shared/docusign';
import { roundNumber } from 'src/utils/transformNumber';
import { IGenericObject } from '../../typing';

@DocusignTemplate('demo', '734c08f1-c7c1-44d9-9247-641fd0e547a8')
@DocusignTemplate('live', '5b6ce50c-ad7e-4494-afcf-384fe49c1865')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class Exhibit8SystemDesignNoticeEsaTemplate {
  @TabDynamic<IGenericObject>(({ systemDesign, quote }) => {
    const fields = parseSystemDesignProducts(systemDesign);

    const obj = {} as any;
    obj.es_kwh = `${roundNumber(
      sumBy(fields.systemDesignBatteries, item => item.storageModelDataSnapshot.ratings.kilowattHours * item.quantity),
      3,
    )}`;

    obj.es_kw = `${roundNumber(
      sumBy(fields.systemDesignBatteries, item => item.storageModelDataSnapshot.ratings.kilowatts * item.quantity),
      3,
    )}`;

    obj.battery_summary = fields.systemDesignBatteries
      .reduce<ISystemDesignProducts['systemDesignBatteries']>((acc, cur) => {
        const batt = acc.find(e => e.storageModelId === cur.storageModelId);

        if (batt) {
          batt.quantity += cur.quantity;
          return acc;
        }

        acc.push(cur);
        return acc;
      }, [])
      .map(
        item =>
          `${item.quantity} x ${item.storageModelDataSnapshot.$meta.manufacturer.name} ${item.storageModelDataSnapshot.name}`,
      )
      .join(', ');

    obj.pv_kw = `${systemDesign?.systemProductionData?.capacityKW || 0}`;

    obj.module_summary = fields.systemDesignModules
      .reduce<ISystemDesignProducts['systemDesignModules']>((acc, cur) => {
        const module = acc.find(e => e.panelModelId === cur.panelModelId);

        if (module) {
          module.numberOfPanels += cur.numberOfPanels;
          return acc;
        }

        acc.push(cur);
        return acc;
      }, [])
      .map(
        item =>
          `${item.numberOfPanels} x ${item.panelModelDataSnapshot.$meta.manufacturer.name} ${item.panelModelDataSnapshot.name}`,
      )
      .join(', ');

    obj.inverter_summary = fields.systemDesignInverters
      .reduce<ISystemDesignProducts['systemDesignInverters']>((acc, cur) => {
        const inverter = acc.find(e => e.inverterModelId === cur.inverterModelId);

        if (inverter) {
          inverter.quantity += cur.quantity;
          return acc;
        }

        acc.push(cur);
        return acc;
      }, [])
      .map(
        item =>
          `${item.quantity} x ${item.inverterModelDataSnapshot.$meta.manufacturer.name} ${item.inverterModelDataSnapshot.name}`,
      )
      .join(', ');

    obj.adder_summary = quote.quoteCostBuildup.adderQuoteDetails
      .map(item => `${item.quantity} x ${item.adderModelDataSnapshot.name}`)
      .join(quote.quoteCostBuildup.adderQuoteDetails.length > 5 ? '\n' : ', ');

    return obj;
  })
  dynamicTabs: unknown;
}

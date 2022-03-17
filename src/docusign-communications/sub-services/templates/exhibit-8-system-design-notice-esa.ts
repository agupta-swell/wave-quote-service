import { sumBy } from 'lodash';
import { parseSystemDesignProducts } from 'src/docusign-communications/utils';
import { DefaultTabType, DocusignTemplate, DOCUSIGN_TAB_TYPE, TabDynamic } from 'src/shared/docusign';
import { IGenericObject } from '../../typing';

@DocusignTemplate('demo', '734c08f1-c7c1-44d9-9247-641fd0e547a8')
@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
export class Exhibit8SystemDesignNoticeEsaTemplate {
  @TabDynamic<IGenericObject>(({ systemDesign }) => {
    const fields = parseSystemDesignProducts(systemDesign);

    const obj = {} as any;
    obj.es_kwh = `${sumBy(fields.systemDesignBatteries, e => e.storageModelDataSnapshot.ratings.kilowattHours)}`;
    obj.es_kw = `${sumBy(fields.systemDesignBatteries, e => e.storageModelDataSnapshot.ratings.kilowatts) / 1000}`;
    obj.battery_summary = fields.systemDesignBatteries
      .map(e => `${e.quantity} x ${e.storageModelDataSnapshot.name}`)
      .join(',');

    obj.pv_kw = `${systemDesign?.systemProductionData?.capacityKW || 0}`;

    obj.module_summary = fields.systemDesignModules
      .map(e => `${e.numberOfPanels} x ${e.panelModelDataSnapshot.name}`)
      .join(',');

    obj.inverter_summary = fields.systemDesignInverters
      .map(e => `${e.quantity} x ${e.inverterModelDataSnapshot.name}`)
      .join('.');

    obj.adder_summary = fields.systemDesignAdders.map(e => `${e.quantity} x ${e.adderDescription}`).join(',');

    return obj;
  })
  dynamicTabs: unknown;
}

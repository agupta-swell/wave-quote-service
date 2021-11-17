import { sumBy } from 'lodash';
import { LeanDocument } from 'mongoose';
import { DefaultTabType, DocusignTemplate, DOCUSIGN_TAB_TYPE, TabDynamic } from 'src/shared/docusign';
import { SystemDesign } from 'src/system-designs/system-design.schema';
import { IGenericObject } from '../../typing';

interface ISystemDesignNoticeX8RequiredFields {
  systemDesignBatteries: LeanDocument<SystemDesign>['roofTopDesignData']['storage'];
  systemDesignModules: LeanDocument<SystemDesign>['roofTopDesignData']['panelArray'];
  systemDesignInverters: LeanDocument<SystemDesign>['roofTopDesignData']['inverters'];
  systemDesignAdders: LeanDocument<SystemDesign>['roofTopDesignData']['adders'];
}

@DefaultTabType(DOCUSIGN_TAB_TYPE.PRE_FILLED_TABS)
@DocusignTemplate('demo', '734c08f1-c7c1-44d9-9247-641fd0e547a8')
export class GetSystemDesignNoticeX8Template {
  @TabDynamic<IGenericObject>(({ systemDesign }) => {
    const { designMode } = systemDesign;

    let fields: ISystemDesignNoticeX8RequiredFields;

    switch (designMode) {
      case 'capacityProduction':
        fields = {
          systemDesignAdders: systemDesign.capacityProductionDesignData.adders,
          systemDesignBatteries: systemDesign.capacityProductionDesignData.storage,
          systemDesignInverters: systemDesign.capacityProductionDesignData.inverters,
          systemDesignModules: systemDesign.capacityProductionDesignData.panelArray,
        };
        break;
      case 'roofTop':
        fields = {
          systemDesignAdders: systemDesign.roofTopDesignData.adders,
          systemDesignBatteries: systemDesign.roofTopDesignData.storage,
          systemDesignInverters: systemDesign.roofTopDesignData.inverters,
          systemDesignModules: systemDesign.roofTopDesignData.panelArray,
        };
        break;
      default:
        throw new Error(`Invalid system design type (got ${designMode})`);
    }

    const obj = {} as any;
    obj.es_kwh = `${sumBy(fields.systemDesignBatteries, e => e.storageModelDataSnapshot.ratings.kilowattHours)}`;
    obj.es_kw = `${sumBy(fields.systemDesignBatteries, e => e.storageModelDataSnapshot.ratings.kilowatts) / 1000}`;
    obj.battery_summary = fields.systemDesignBatteries
      .map(e => `${e.quantity} x ${e.storageModelDataSnapshot.name}`)
      .join(',');

    obj.pv_kw = `${systemDesign.systemProductionData.capacityKW}`;

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

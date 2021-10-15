import { sum, sumBy } from 'lodash';
import { LeanDocument } from 'mongoose';
import { SystemDesign } from 'src/system-designs/system-design.schema';
import { TemplateDataBuilder } from '../../typing';

interface ISystemDesignNoticeX8RequiredFields {
  systemDesignBatteries: LeanDocument<SystemDesign>['roofTopDesignData']['storage'];
  systemDesignModules: LeanDocument<SystemDesign>['roofTopDesignData']['panelArray'];
  systemDesignInverters: LeanDocument<SystemDesign>['roofTopDesignData']['inverters'];
  systemDesignAdders: LeanDocument<SystemDesign>['roofTopDesignData']['adders'];
}
export const getSystemDesignNoticeX8Data: TemplateDataBuilder = ({ systemDesign }) => {
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
};

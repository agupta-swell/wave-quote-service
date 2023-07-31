import { cloneDeep } from 'lodash';
import { DESIGN_MODE } from 'src/system-designs/constants';
import { SystemDesignWithManufacturerMeta } from 'src/system-designs/system-design.schema';

export interface ISystemDesignProducts {
  systemDesignBatteries: SystemDesignWithManufacturerMeta['roofTopDesignData']['storage'];
  systemDesignModules: SystemDesignWithManufacturerMeta['roofTopDesignData']['panelArray'];
  systemDesignInverters: SystemDesignWithManufacturerMeta['roofTopDesignData']['inverters'];
  systemDesignAdders: SystemDesignWithManufacturerMeta['roofTopDesignData']['adders'];
}

export const parseSystemDesignProducts = (systemDesign: SystemDesignWithManufacturerMeta): ISystemDesignProducts => {
  const cloneSystemDesign = cloneDeep(systemDesign);
  const { designMode, roofTopDesignData, capacityProductionDesignData } = cloneSystemDesign;

  if (designMode === DESIGN_MODE.ROOF_TOP) {
    return {
      systemDesignAdders: roofTopDesignData.adders,
      systemDesignBatteries: roofTopDesignData.storage,
      systemDesignInverters: roofTopDesignData.inverters,
      systemDesignModules: roofTopDesignData.panelArray,
    };
  }

  return {
    systemDesignAdders: capacityProductionDesignData.adders,
    systemDesignBatteries: capacityProductionDesignData.storage,
    systemDesignInverters: capacityProductionDesignData.inverters,
    systemDesignModules: capacityProductionDesignData.panelArray,
  };
};

import { LeanDocument } from 'mongoose';
import { Manufacturer } from 'src/manufacturers/manufacturer.schema';
import { ISnapshotProduct } from 'src/products-v2/interfaces';
import { WithMetaOfType } from 'src/shared/mongo';
import { SystemDesignWithManufacturerMeta } from 'src/system-designs/system-design.schema';

export interface ISystemDesignProducts {
  systemDesignBatteries: SystemDesignWithManufacturerMeta['roofTopDesignData']['storage'];
  systemDesignModules: SystemDesignWithManufacturerMeta['roofTopDesignData']['panelArray'];
  systemDesignInverters: SystemDesignWithManufacturerMeta['roofTopDesignData']['inverters'];
  systemDesignAdders: SystemDesignWithManufacturerMeta['roofTopDesignData']['adders'];
}

export const parseSystemDesignProducts = (systemDesign: SystemDesignWithManufacturerMeta): ISystemDesignProducts => {
  const { designMode, roofTopDesignData, capacityProductionDesignData } = systemDesign;

  if (designMode === 'roofTop') {
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

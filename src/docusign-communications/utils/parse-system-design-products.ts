import { LeanDocument } from 'mongoose';
import { SystemDesign } from 'src/system-designs/system-design.schema';

export interface ISystemDesignProducts {
  systemDesignBatteries: LeanDocument<SystemDesign>['roofTopDesignData']['storage'];
  systemDesignModules: LeanDocument<SystemDesign>['roofTopDesignData']['panelArray'];
  systemDesignInverters: LeanDocument<SystemDesign>['roofTopDesignData']['inverters'];
  systemDesignAdders: LeanDocument<SystemDesign>['roofTopDesignData']['adders'];
}

export const parseSystemDesignProducts = (
  systemDesign: SystemDesign | LeanDocument<SystemDesign>,
): ISystemDesignProducts => {
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

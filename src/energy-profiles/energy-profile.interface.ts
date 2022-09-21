import { IEnergyProfileProduction } from 'src/system-production/system-production.schema';
import { TypicalUsageKwh } from 'src/utilities/sub-services';
import { IExistingSystemProduction } from 'src/utilities/utility.schema';

export interface IBatteryDataSeries {
  average: IEnergyProfileProduction;
  typical: IEnergyProfileProduction;
}

export interface IGetEnergyProfile {
  usage: TypicalUsageKwh;
  solarProduction: IEnergyProfileProduction;
  batteryChargingSeries: IEnergyProfileProduction;
  batteryDischargingSeries: IEnergyProfileProduction;
  existingSystemProduction: IExistingSystemProduction;
  batteryDataSeriesForTypicalDay: {
    batteryChargingSeries: IEnergyProfileProduction;
    batteryDischargingSeries: IEnergyProfileProduction;
  };
  postInstallSiteDemandSeries: IEnergyProfileProduction;
}

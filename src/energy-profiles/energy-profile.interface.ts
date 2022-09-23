import { IEnergyProfileProduction } from 'src/system-production/system-production.schema';
import { TypicalUsageKwh } from 'src/utilities/sub-services';

export interface IBatteryDataSeries {
  average: IEnergyProfileProduction;
  typical: IEnergyProfileProduction;
}

export interface INetLoad {
  average: IEnergyProfileProduction;
  typical: IEnergyProfileProduction;
}

export interface IGetEnergyProfile {
  usage: TypicalUsageKwh;
  solarProduction: IEnergyProfileProduction;
  batteryChargingSeries: IEnergyProfileProduction;
  batteryDischargingSeries: IEnergyProfileProduction;
  existingSystemProduction: IEnergyProfileProduction;
  batteryDataSeriesForTypicalDay: {
    batteryChargingSeries: IEnergyProfileProduction;
    batteryDischargingSeries: IEnergyProfileProduction;
  };
  netLoadAverage: IEnergyProfileProduction;
}

import { IEnergyProfileProduction } from 'src/system-productions/system-production.schema';

export interface IBatteryDataSeries {
  average: IEnergyProfileProduction;
  typical: IEnergyProfileProduction;
}

export interface INetLoad {
  average: IEnergyProfileProduction;
  typical: IEnergyProfileProduction;
}

export interface IGetEnergyProfile {
  expectedUsage: IEnergyProfileProduction;
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

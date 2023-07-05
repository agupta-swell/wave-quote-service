import { getNetLoadTypical } from 'src/energy-profiles/utils';
import { IEnergyProfileProduction } from 'src/system-productions/system-production.schema';
import { IBatteryDataSeries, IGetEnergyProfile, INetLoad } from '../energy-profile.interface';

export class GetEnergyProfile {
  public expectedUsage: IEnergyProfileProduction;

  public solarProduction: IEnergyProfileProduction;

  public batteryChargingSeries: IBatteryDataSeries;

  public batteryDischargingSeries: IBatteryDataSeries;

  public existingSystemProduction: IEnergyProfileProduction;

  public netLoad: INetLoad;

  constructor(props: IGetEnergyProfile) {
    const {
      expectedUsage,
      solarProduction,
      batteryChargingSeries,
      batteryDischargingSeries,
      existingSystemProduction,
      batteryDataSeriesForTypicalDay,
      netLoadAverage,
    } = props;

    this.expectedUsage = expectedUsage;
    this.solarProduction = solarProduction;

    this.batteryChargingSeries = {
      average: batteryChargingSeries,
      typical: batteryDataSeriesForTypicalDay.batteryChargingSeries,
    };

    this.batteryDischargingSeries = {
      average: batteryDischargingSeries,
      typical: batteryDataSeriesForTypicalDay.batteryDischargingSeries,
    };

    this.existingSystemProduction = existingSystemProduction;

    this.netLoad = {
      average: netLoadAverage,
      typical: getNetLoadTypical(
        expectedUsage,
        solarProduction,
        batteryDataSeriesForTypicalDay.batteryChargingSeries,
        batteryDataSeriesForTypicalDay.batteryDischargingSeries,
      ),
    };
  }
}

export class GetEnergyProfileResDto {
  public status: string;

  public data: GetEnergyProfile;

  constructor(props: IGetEnergyProfile) {
    this.status = 'OK';
    this.data = new GetEnergyProfile(props);
  }
}

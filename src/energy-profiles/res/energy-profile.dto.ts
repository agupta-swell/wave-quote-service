import { IEnergyProfileProduction } from 'src/system-production/system-production.schema';
import { IHistoricalUsage } from 'src/utilities/res';
import { IExistingSystemProduction } from 'src/utilities/utility.schema';
import { IBatteryDataSeries, IGetEnergyProfile } from '../energy-profile.interface';

export class GetEnergyProfile {
  public historicalUsage: IHistoricalUsage;

  public solarProduction: IEnergyProfileProduction;

  public batteryChargingSeries: IBatteryDataSeries;

  public batteryDischargingSeries: IBatteryDataSeries;

  public existingSystemProduction: IExistingSystemProduction;

  public postInstallSiteDemandSeries: IEnergyProfileProduction;

  constructor(props: IGetEnergyProfile) {
    const {
      usage,
      solarProduction,
      batteryChargingSeries,
      batteryDischargingSeries,
      existingSystemProduction,
      batteryDataSeriesForTypicalDay,
      postInstallSiteDemandSeries,
    } = props;

    const [annualUsage, ...monthlyUsage] = usage;

    this.historicalUsage = {
      annualUsage,
      monthlyUsage,
    };

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

    this.postInstallSiteDemandSeries = postInstallSiteDemandSeries;
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

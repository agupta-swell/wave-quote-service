import { IEnergyProfileProduction } from 'src/system-production/system-production.schema';
import { IHistoricalUsage } from 'src/utilities/res';
import { IGetEnergyProfile } from '../energy-profile.interface';

export class GetEnergyProfile {
  public historicalUsage: IHistoricalUsage;

  public solarProduction: IEnergyProfileProduction;

  public batteryChargingSeries: IEnergyProfileProduction;

  public batteryDischargingSeries: IEnergyProfileProduction;

  constructor(props: IGetEnergyProfile) {
    const { usage, solarProduction, batteryChargingSeries, batteryDischargingSeries } = props;

    const [annualUsage, ...monthlyUsage] = usage;

    this.historicalUsage = {
      annualUsage,
      monthlyUsage,
    };

    this.solarProduction = solarProduction;
    this.batteryChargingSeries = batteryChargingSeries;
    this.batteryDischargingSeries = batteryDischargingSeries;
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

import { IEnergyProfileProduction } from 'src/system-production/system-production.schema';
import { IHistoricalUsage } from 'src/utilities/res';
import { IExistingSystemProduction } from 'src/utilities/utility.schema';
import { IGetEnergyProfile } from '../energy-profile.interface';

export class GetEnergyProfile {
  public historicalUsage: IHistoricalUsage;

  public solarProduction: IEnergyProfileProduction;

  public batteryChargingSeries: IEnergyProfileProduction;

  public batteryDischargingSeries: IEnergyProfileProduction;

  public existingSystemProduction: IExistingSystemProduction;

  constructor(props: IGetEnergyProfile) {
    const { usage, solarProduction, batteryChargingSeries, batteryDischargingSeries, existingSystemProduction } = props;

    const [annualUsage, ...monthlyUsage] = usage;

    this.historicalUsage = {
      annualUsage,
      monthlyUsage,
    };

    this.solarProduction = solarProduction;
    this.batteryChargingSeries = batteryChargingSeries;
    this.batteryDischargingSeries = batteryDischargingSeries;
    this.existingSystemProduction = existingSystemProduction;
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

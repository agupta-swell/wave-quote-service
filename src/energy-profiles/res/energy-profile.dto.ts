import { ISunroofHourlyProduction } from 'src/system-designs/sub-services/types';
import { IPvWattProduction } from 'src/system-production/system-production.schema';
import { IHistoricalUsage } from 'src/utilities/res';
import { IGetEnergyProfile } from '../energy-profile.interface';

export class GetEnergyProfile {
  public historicalUsage: IHistoricalUsage;

  public solarProduction: ISunroofHourlyProduction;

  constructor(props: IGetEnergyProfile) {
    const { usage, solarProduction } = props;

    const [annualUsage, ...monthlyUsage] = usage;

    this.historicalUsage = {
      annualUsage,
      monthlyUsage,
    };

    this.solarProduction = solarProduction;
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

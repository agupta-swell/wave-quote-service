import { ISunroofHourlyProduction } from 'src/system-designs/sub-services/types';
import { TypicalUsageKwh } from 'src/utilities/sub-services';

export interface IGetEnergyProfile {
  usage: TypicalUsageKwh;
  solarProduction: ISunroofHourlyProduction;
}

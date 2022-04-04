import { IPvWattProduction } from 'src/system-production/system-production.schema';
import { TypicalUsageKwh } from 'src/utilities/sub-services';

export interface IGetEnergyProfile {
  usage: TypicalUsageKwh;
  systemProduction: IPvWattProduction;
}

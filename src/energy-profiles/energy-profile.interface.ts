import { IEnergyProfileProduction } from 'src/system-production/system-production.schema';
import { TypicalUsageKwh } from 'src/utilities/sub-services';
import { IExistingSystemProduction } from 'src/utilities/utility.schema';

export interface IGetEnergyProfile {
  usage: TypicalUsageKwh;
  solarProduction: IEnergyProfileProduction;
  batteryChargingSeries: IEnergyProfileProduction;
  batteryDischargingSeries: IEnergyProfileProduction;
  existingSystemProduction: IExistingSystemProduction;
}

import { ExposeProp } from 'src/shared/decorators';
import { IPinballRateAmount } from '../utility.interface';
import { CHARGING_LOGIC_TYPE } from '../constants';

export class PinballSimulatorDto {
  @ExposeProp()
  batteryStoredEnergySeries: number[];

  @ExposeProp()
  batteryChargingSeries: number[];

  @ExposeProp()
  batteryDischargingSeries: number[];

  @ExposeProp()
  postInstallSiteDemandSeries: number[];

  @ExposeProp()
  rateAmountHourly: IPinballRateAmount[];

  @ExposeProp()
  chargingLogicType: CHARGING_LOGIC_TYPE | undefined;

  @ExposeProp()
  year?: number;
}

export class PinballSimulatorAndCostPostInstallationDto extends PinballSimulatorDto {
  @ExposeProp()
  costPostInstallation: number;
}

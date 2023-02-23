import { ExposeProp } from 'src/shared/decorators';
import { IPinballRateAmount } from '../utility.interface';

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
  year?: number;
}

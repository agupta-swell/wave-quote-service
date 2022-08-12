import { ExposeProp } from 'src/shared/decorators';

export class PinballSimulatorDto {
  @ExposeProp()
  batteryStoredEnergySeries: number[];

  @ExposeProp()
  batteryChargingSeries: number[];

  @ExposeProp()
  batteryDischargingSeries: number[];

  @ExposeProp()
  postInstallSiteDemandSeries: number[];
}

import { ExposeProp } from 'src/shared/decorators';

export class BaseRatingResDto {
  @ExposeProp()
  watts: number;
}

export class BatteryRatingResDto {
  @ExposeProp()
  kilowatts: number;

  @ExposeProp()
  kilowattHours: number;
}

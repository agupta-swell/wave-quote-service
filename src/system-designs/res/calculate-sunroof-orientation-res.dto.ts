import { ExposeProp } from 'src/shared/decorators';

export class CalculateSunroofOrientationResDto {
  @ExposeProp()
  sunroofPrimaryOrientationSide: number;

  @ExposeProp()
  sunroofPitch: number;

  @ExposeProp()
  sunroofAzimuth: number;
}

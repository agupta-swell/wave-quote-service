import { ExposeProp } from 'src/shared/decorators';

export class CalculateSunroofResDto {
  @ExposeProp()
  sunroofPrimaryOrientationSide: number;

  @ExposeProp()
  sunroofPitch: number;

  @ExposeProp()
  sunroofAzimuth: number;
}

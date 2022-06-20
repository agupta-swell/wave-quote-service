import { Default, ExposeProp } from 'src/shared/decorators';
import { BoundingBoxResDto } from './get-sunroof-bounding-boxes-res.dto';

export class CalculateSunroofOrientationResDto {
  @ExposeProp()
  sunroofPrimaryOrientationSide: number;

  @ExposeProp()
  sunroofPitch: number;

  @ExposeProp()
  sunroofAzimuth: number;

  @ExposeProp({ type: [BoundingBoxResDto] })
  @Default([])
  boundingBoxes: BoundingBoxResDto[];
}

import { Default, ExposeAndMap, ExposeProp } from 'src/shared/decorators';

class CoordinateResDto {
  @ExposeAndMap({}, ({ obj }) => obj?.latitude)
  lat: number;

  @ExposeAndMap({}, ({ obj }) => obj?.longitude)
  lng: number;
}

export class BoundingBoxResDto {
  @ExposeProp({ type: CoordinateResDto })
  sw: CoordinateResDto;

  @ExposeProp({ type: CoordinateResDto })
  ne: CoordinateResDto;

  @ExposeAndMap({}, ({ obj }) => obj?.azimuthDegrees)
  azimuth: number;

  @ExposeAndMap({}, ({ obj }) => obj?.pitchDegrees)
  pitch: number;

  @ExposeProp()
  sunroofPrimaryOrientationSide: number;
}

export class GetBoundingBoxesResDto {
  @ExposeProp({ type: [BoundingBoxResDto] })
  @Default([])
  boundingBoxes: BoundingBoxResDto[];
}

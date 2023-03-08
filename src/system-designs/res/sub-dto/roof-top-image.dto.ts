import { ExposeProp } from 'src/shared/decorators';
import { LatLng } from './solar-panel-array.dto';

class LatLngBoundsDto {
  @ExposeProp({ type: LatLng })
  ne: LatLng;

  @ExposeProp({ type: LatLng })
  sw: LatLng;
}

class PointDto {
  @ExposeProp()
  x: number;

  @ExposeProp()
  y: number;
}

class LineSegmentLengthDto {
  @ExposeProp()
  feet: number;

  @ExposeProp()
  inch: number;
}

class CanvasDto {
  @ExposeProp({ isArray: true, type: PointDto })
  line: PointDto[];

  @ExposeProp({ isArray: true, type: PointDto })
  arrow: PointDto[];

  @ExposeProp({ type: LineSegmentLengthDto })
  lineSegmentLength: LineSegmentLengthDto;
}

export class RoofTopImageResDto {
  @ExposeProp()
  key: string;

  @ExposeProp({ type: LatLngBoundsDto })
  latLngBounds: LatLngBoundsDto;

  @ExposeProp()
  rotationDegrees: number;

  @ExposeProp({ type: CanvasDto })
  canvas: CanvasDto;

  @ExposeProp()
  imageURL: string;
}

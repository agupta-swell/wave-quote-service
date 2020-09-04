import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ORIENTATION } from '../constants';
import { ProductDto } from './product.dto';
import { LatLng } from './system-design.dto';

export class SolarPanelArray {
  @ApiProperty()
  primaryOrientationSide: Number;

  @ApiProperty()
  panelOrientation: ORIENTATION;

  @ApiProperty({ isArray: true, type: LatLng })
  boundPolygon: LatLng[];

  @ApiProperty({ isArray: true, type: [LatLng] })
  panels: [LatLng][];

  @ApiPropertyOptional()
  setbacks: Map<string, number>;

  @ApiPropertyOptional({ isArray: true, type: LatLng })
  setbacksPolygon: LatLng[];

  @ApiPropertyOptional({ isArray: true, type: LatLng })
  keepouts: LatLng[][];

  @ApiProperty()
  pitch: number;

  @ApiProperty()
  azimuth: Number;

  @ApiPropertyOptional()
  rowSpacing: number;

  @ApiProperty()
  panelModelDataSnapshot: ProductDto;

  @ApiProperty()
  panelModelSnapshotDate: Date;

  @ApiProperty()
  numberOfPanels: Number;
}

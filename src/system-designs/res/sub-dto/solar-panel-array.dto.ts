import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ORIENTATION } from '../../constants';
import { ProductDto } from './product.dto';

export class LatLng {
  @ApiProperty()
  lat: Number;

  @ApiProperty()
  lng: Number;
}

export class SolarPanelArrayDto {
  @ApiProperty()
  primaryOrientationSide: Number;

  @ApiProperty()
  panelOrientation: ORIENTATION;

  @ApiProperty({ isArray: true, type: LatLng })
  boundPolygon: LatLng[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          lat: { type: 'number' },
          lng: { type: 'number' },
        },
      },
    },
  })
  panels: LatLng[][];

  @ApiPropertyOptional()
  setbacks: Map<string, number>;

  @ApiPropertyOptional({ isArray: true, type: LatLng })
  setbacksPolygon: LatLng[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          lat: { type: 'number' },
          lng: { type: 'number' },
        },
      },
    },
  })
  keepouts: LatLng[][];

  @ApiProperty()
  pitch: number;

  @ApiProperty()
  azimuth: Number;

  @ApiPropertyOptional()
  rowSpacing: number;

  @ApiProperty({ type: ProductDto })
  panelModelDataSnapshot: ProductDto;

  @ApiProperty()
  panelModelSnapshotDate: Date;

  @ApiProperty()
  numberOfPanels: Number;

  @ApiProperty()
  shadingPercentage: Number;
}

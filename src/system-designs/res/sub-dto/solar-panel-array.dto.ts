import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ORIENTATION } from '../../constants';
import { ProductDto } from './product.dto';

export class LatLng {
  @ApiProperty()
  lat: number;

  @ApiProperty()
  lng: number;
}

export class SolarPanelArrayDto {
  @ApiProperty()
  primaryOrientationSide: number;

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
  azimuth: number;

  @ApiPropertyOptional()
  rowSpacing: number;

  @ApiProperty({ type: ProductDto })
  panelModelDataSnapshot: ProductDto;

  @ApiProperty()
  panelModelSnapshotDate: Date;

  @ApiProperty()
  numberOfPanels: number;

  @ApiProperty()
  losses: number;
}

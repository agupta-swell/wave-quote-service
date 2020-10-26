import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString, ValidateNested } from 'class-validator';
import { ORIENTATION } from '../../constants';

class LatLng {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  lng: number;
}

export class SolarPanelArrayDto1 {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  primaryOrientationSide: number;

  @ApiProperty({ enum: [ORIENTATION.LANDSCAPE, ORIENTATION.PORTRAIT] })
  @IsNotEmpty()
  panelOrientation: ORIENTATION;

  @ApiProperty({ isArray: true, type: LatLng })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LatLng)
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
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LatLng)
  panels: LatLng[][];

  @ApiPropertyOptional()
  setbacks: Map<string, number>;

  @ApiPropertyOptional({ isArray: true, type: LatLng })
  @ValidateNested({ each: true })
  @Type(() => LatLng)
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
  @ValidateNested({ each: true })
  @Type(() => LatLng)
  keepouts: LatLng[][];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  pitch: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  azimuth: number;

  @ApiPropertyOptional()
  @IsNumber()
  rowSpacing: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  panelModelId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  numberOfPanels: number;
}

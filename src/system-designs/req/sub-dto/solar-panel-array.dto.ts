import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ORIENTATION } from '../../constants';
import { LatLngDto } from './lat-lng.dto';

export class SolarPanelArrayDto1 {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  primaryOrientationSide: number;

  @ApiProperty({ enum: [ORIENTATION.LANDSCAPE, ORIENTATION.PORTRAIT] })
  @IsNotEmpty()
  panelOrientation: ORIENTATION;

  @ApiProperty({ isArray: true, type: LatLngDto })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LatLngDto)
  boundPolygon: LatLngDto[];

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
  @Type(() => LatLngDto)
  panels: LatLngDto[][];

  @ApiPropertyOptional()
  setbacks: Map<string, number>;

  @ApiPropertyOptional({ isArray: true, type: LatLngDto })
  @ValidateNested({ each: true })
  @Type(() => LatLngDto)
  setbacksPolygon: LatLngDto[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
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
  @IsMongoId()
  panelModelId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  numberOfPanels: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(-5)
  @Max(99)
  losses: number;

  @ApiProperty()
  @IsBoolean()
  useSunroof: boolean;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  sunroofPrimaryOrientationSide?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  sunroofPitch: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  sunroofAzimuth: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  overrideRooftopDetails: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsMongoId()
  mountTypeId: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  hasSunroofIrradiance: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  hasSunroofRooftop: boolean;
}

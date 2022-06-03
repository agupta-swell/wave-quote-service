import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class Coordinate {
  @ApiProperty()
  @IsLatitude()
  lat: number;

  @ApiProperty()
  @IsLongitude()
  lng: number;
}
export class CalculateSunroofOrientationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  opportunityId: string;

  @ApiProperty()
  @IsLatitude()
  @ValidateIf(e => !e.systemDesignId)
  centerLat?: number;

  @ApiProperty()
  @IsLongitude()
  @ValidateIf(e => !e.systemDesignId)
  centerLng?: number;

  @ApiProperty({ isArray: true })
  @IsNumber({}, { each: true })
  sideAzimuths: number[];

  @ApiProperty({ type: [Coordinate] })
  @ValidateNested({ each: true })
  @Type(() => Coordinate)
  polygons: Coordinate[];

  @ApiProperty()
  @IsMongoId()
  @ValidateIf(e => !e.centerLat)
  systemDesignId?: string;

  @ApiProperty()
  @IsString()
  @ValidateIf(e => e.systemDesignId)
  arrayId?: string;
}

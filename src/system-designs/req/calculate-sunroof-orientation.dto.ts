import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

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
  latitude: number;

  @ApiProperty()
  @IsLongitude()
  longitude: number;

  @ApiProperty()
  @IsLatitude()
  centerLat: number;

  @ApiProperty()
  @IsLongitude()
  centerLng: number;

  @ApiProperty({ isArray: true })
  @IsNumber({}, { each: true })
  sideAzimuths: number[];

  @ApiProperty({ type: [Coordinate] })
  @ValidateNested({ each: true })
  @Type(() => Coordinate)
  polygons: Coordinate[];
}

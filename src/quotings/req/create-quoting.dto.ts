import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString, ValidateNested } from 'class-validator';

export class LatLng {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  lat: Number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  lng: Number;
}

export class Location {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LatLng)
  latlng: LatLng;
}

export class Polygon {
  @ApiProperty({ isArray: true, type: LatLng })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LatLng)
  polygon: LatLng[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  side: Number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  azimuth: Number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  panelId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  totalPanels: Number;

  @ApiProperty({ isArray: true, type: [LatLng] })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LatLng)
  panels: [LatLng][];
}

export class CreateQuotingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ type: Location })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Location)
  location: Location;

  @ApiProperty({ type: Polygon, isArray: true })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Polygon)
  polygons: Polygon[];
}

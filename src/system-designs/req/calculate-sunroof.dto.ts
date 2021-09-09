import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

export class CalculateSunroofDto {
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
}

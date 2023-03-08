import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class LatLngDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  lng: number;
}

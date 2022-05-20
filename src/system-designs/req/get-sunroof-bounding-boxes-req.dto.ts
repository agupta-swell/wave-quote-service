import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GetBoundingBoxesReqDto {
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
  @Transform(({ value }) => value?.split(',').map(Number))
  @IsNumber({}, { each: true })
  sideAzimuths: number[];
}

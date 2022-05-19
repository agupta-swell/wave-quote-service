import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsMongoId, IsNotEmpty, IsNumber, IsString, ValidateIf } from 'class-validator';

export class GetBoundingBoxesReqDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  opportunityId: string;

  @ApiProperty()
  @Transform(({ value }) => value?.split(',').map(Number))
  @IsNumber({}, { each: true })
  sideAzimuths: number[];

  @ApiProperty()
  @IsMongoId()
  systemDesignId: string;

  @ApiProperty()
  @IsString()
  arrayId: string;
}

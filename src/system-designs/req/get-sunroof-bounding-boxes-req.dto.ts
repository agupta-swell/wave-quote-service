import { ApiProperty } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsNotEmpty, IsString } from 'class-validator';

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
}

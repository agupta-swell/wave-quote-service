import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateGeoLocation {
  @ApiProperty()
  @IsString()
  opportunityId: string;

  @ApiProperty()
  @IsString()
  lat: string;

  @ApiProperty()
  @IsString()
  long: string;
}

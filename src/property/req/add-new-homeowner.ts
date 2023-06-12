import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddNewHomeownerReqDto {
  @ApiProperty()
  @IsString()
  propertyId: string;

  @ApiProperty()
  @IsString()
  newContactId: string;
}

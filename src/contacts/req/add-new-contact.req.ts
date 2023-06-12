import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ContactReqDto } from './contact.req';

export class AddNewContactReqDto {
  @ApiProperty()
  data: ContactReqDto;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  propertyId: string;
}

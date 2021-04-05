import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class AddressDataDto {
  @ApiProperty()
  @IsString()
  addressLine: string;

  @ApiProperty()
  @IsNumber()
  zipCode: number;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  state: string;
}

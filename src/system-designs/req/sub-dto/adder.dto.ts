import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AdderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  adderDescription: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  adderId: string;
}

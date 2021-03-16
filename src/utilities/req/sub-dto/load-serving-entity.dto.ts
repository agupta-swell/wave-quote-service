import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class LoadServingEntityDto {
  @ApiProperty()
  @IsString()
  lseName: string;

  @ApiProperty()
  @IsString()
  lseCode: string;

  @ApiProperty()
  @IsNumber()
  zipCode: number;

  @ApiProperty()
  @IsString()
  serviceType: string;

  @ApiProperty()
  @IsString()
  lseId: string;
}

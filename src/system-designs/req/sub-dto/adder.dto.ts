import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AdderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  adderId: string;
}

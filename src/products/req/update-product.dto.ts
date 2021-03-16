import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateProductDtoReq {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  insertionRule: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class SunroofDriftCorrectionReqDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  x: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  y: number;
}

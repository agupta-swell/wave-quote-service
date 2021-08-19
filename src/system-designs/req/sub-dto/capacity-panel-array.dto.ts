import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString, Max, Min } from 'class-validator';

export class CapacityPanelArrayReqDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  arrayId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  capacity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  production: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  pitch: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  azimuth: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  panelModelId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  numberOfPanels: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(-5)
  @Max(99)
  losses: number;
}

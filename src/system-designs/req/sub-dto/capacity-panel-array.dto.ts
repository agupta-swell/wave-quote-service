import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString, Max, Min } from 'class-validator';

export class CapacityPanelArrayReqDto {
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
  @IsPositive()
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
  @Min(0)
  @Max(99)
  losses: number;
}

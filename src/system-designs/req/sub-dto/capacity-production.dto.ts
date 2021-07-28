import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { InverterDto } from './inverter.dto';
import { StorageDto } from './storage.dto';

export class CapacityProductionDataDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  capacity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  production: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  azimuth: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  losses: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  pitch: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  numberOfPanels: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  panelModelId: number;

  @ApiProperty({
    type: InverterDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => InverterDto)
  inverters: InverterDto[];

  @ApiProperty({
    type: StorageDto,
    isArray: true,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => StorageDto)
  storage: StorageDto[];
}

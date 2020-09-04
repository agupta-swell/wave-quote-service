import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
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
  numberOfPanels: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  panelModelId: number;

  @ApiProperty({
    type: InverterDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => InverterDto)
  inverters: InverterDto[];

  @ApiProperty({
    type: StorageDto,
    isArray: true,
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => StorageDto)
  storage: StorageDto[];
}

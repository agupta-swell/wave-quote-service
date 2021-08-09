import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { AdderDto } from './adder.dto';
import { AncillaryEquipmentDto } from './ancillary-equipment.dto';
import { BalanceOfSystemDto } from './balance-of-system.dto';
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
  @IsPositive()
  numberOfPanels: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  panelModelId: string;

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

  @ApiProperty({
    type: AdderDto,
    isArray: true,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AdderDto)
  adders: AdderDto[];

  @ApiPropertyOptional({
    type: BalanceOfSystemDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => BalanceOfSystemDto)
  balanceOfSystems: BalanceOfSystemDto[];

  @ApiPropertyOptional({
    type: AncillaryEquipmentDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => AncillaryEquipmentDto)
  ancillaryEquipments: AncillaryEquipmentDto[];
}

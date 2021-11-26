import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { AdderDto } from './adder.dto';
import { AncillaryEquipmentDto } from './ancillary-equipment.dto';
import { BalanceOfSystemDto } from './balance-of-system.dto';
import { CapacityPanelArrayReqDto } from './capacity-panel-array.dto';
import { InverterDto } from './inverter.dto';
import { StorageDto } from './storage.dto';
import { SoftCostDto } from './soft-cost.dto';

export class CapacityProductionDataDto {
  @ApiPropertyOptional({
    type: CapacityPanelArrayReqDto,
    isArray: true,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CapacityPanelArrayReqDto)
  panelArray: CapacityPanelArrayReqDto[];

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

  @ApiPropertyOptional({
    type: SoftCostDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => SoftCostDto)
  softCosts: SoftCostDto[];
}

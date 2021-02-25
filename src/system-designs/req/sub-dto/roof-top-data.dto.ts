import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { AdderDto } from './adder.dto';
import { AncillaryEquipmentDto } from './ancillary-equipment.dto';
import { BalanceOfSystemDto } from './balance-of-system.dto';
import { InverterDto } from './inverter.dto';
import { SolarPanelArrayDto1 } from './solar-panel-array.dto';
import { StorageDto } from './storage.dto';

export class RoofTopDataReqDto {
  @ApiPropertyOptional({
    type: SolarPanelArrayDto1,
    isArray: true,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SolarPanelArrayDto1)
  panelArray: SolarPanelArrayDto1[];

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

  @ApiProperty({
    type: AdderDto,
    isArray: true,
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AdderDto)
  adders: AdderDto[];

  @ApiPropertyOptional({
    type: BalanceOfSystemDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => BalanceOfSystemDto)
  balanceOfSystem: BalanceOfSystemDto[];

  @ApiPropertyOptional({
    type: AncillaryEquipmentDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @Type(() => AncillaryEquipmentDto)
  ancillaryEquipments: AncillaryEquipmentDto[];
}

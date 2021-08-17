import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { LatLng } from 'src/system-designs/res/sub-dto';
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
    type: 'array',
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          lat: { type: 'number' },
          lng: { type: 'number' },
        },
      },
    },
  })
  @ValidateNested({ each: true })
  @Type(() => LatLng)
  keepouts: LatLng[][];

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

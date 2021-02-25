import { ApiProperty } from '@nestjs/swagger';
import { AdderDto } from './adder.dto';
import { AncillaryEquipmentDto } from './ancillary-equipment.dto';
import { BalanceOfSystemDto } from './balance-of-system.dto';
import { InverterDto } from './inverter.dto';
import { SolarPanelArrayDto } from './solar-panel-array.dto';
import { StorageDto } from './storage.dto';

export class RoofTopDataDto {
  @ApiProperty({
    type: SolarPanelArrayDto,
    isArray: true,
  })
  panelArray: SolarPanelArrayDto[];

  @ApiProperty({
    type: InverterDto,
    isArray: true,
  })
  inverters: InverterDto[];

  @ApiProperty({
    type: StorageDto,
    isArray: true,
  })
  storage: StorageDto[];

  @ApiProperty({
    type: AdderDto,
    isArray: true,
  })
  adders: AdderDto[];

  @ApiProperty({
    type: BalanceOfSystemDto,
    isArray: true,
  })
  balanceOfSystem: BalanceOfSystemDto[];

  @ApiProperty({
    type: AncillaryEquipmentDto,
    isArray: true,
  })
  ancillaryEquipments: AncillaryEquipmentDto[];
}

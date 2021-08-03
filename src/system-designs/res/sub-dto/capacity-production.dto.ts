import { ExposeProp } from 'src/shared/decorators';
import { AdderDto } from './adder.dto';
import { AncillaryEquipmentDto } from './ancillary-equipment.dto';
import { BalanceOfSystemDto } from './balance-of-system.dto';
import { InverterDto } from './inverter.dto';
import { StorageDto } from './storage.dto';

export class CapacityProductionDataDto {
  @ExposeProp()
  capacity: number;

  @ExposeProp()
  production: number;

  @ExposeProp()
  numberOfPanels: number;

  @ExposeProp()
  panelModelId: number;

  @ExposeProp()
  pitch: number;

  @ExposeProp()
  azimuth: number;

  @ExposeProp()
  losses: number;

  @ExposeProp({
    type: InverterDto,
    isArray: true,
  })
  inverters: InverterDto[];

  @ExposeProp({
    type: StorageDto,
    isArray: true,
  })
  storage: StorageDto[];

  @ExposeProp({
    type: AdderDto,
    isArray: true,
  })
  adders: AdderDto[];

  @ExposeProp({
    type: BalanceOfSystemDto,
    isArray: true,
  })
  balanceOfSystems: BalanceOfSystemDto[];

  @ExposeProp({
    type: AncillaryEquipmentDto,
    isArray: true,
  })
  ancillaryEquipments: AncillaryEquipmentDto[];
}

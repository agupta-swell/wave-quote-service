import { ExposeProp } from 'src/shared/decorators';
import { AdderDto } from './adder.dto';
import { AncillaryEquipmentDto } from './ancillary-equipment.dto';
import { BalanceOfSystemDto } from './balance-of-system.dto';
import { CapacityPanelArrayResDto } from './capacity-panel-array.dto';
import { InverterDto } from './inverter.dto';
import { StorageDto } from './storage.dto';
import { SoftCostDto } from './soft-cost.dto';

export class CapacityProductionDataDto {
  @ExposeProp({
    type: CapacityPanelArrayResDto,
    isArray: true,
  })
  panelArray: CapacityPanelArrayResDto[];

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

  @ExposeProp({
    type: SoftCostDto,
    isArray: true,
  })
  softCosts: SoftCostDto[];
}

import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';
import { AdderDto } from './adder.dto';
import { AncillaryEquipmentDto } from './ancillary-equipment.dto';
import { BalanceOfSystemDto } from './balance-of-system.dto';
import { InverterDto } from './inverter.dto';
import { LatLng, SolarPanelArrayDto } from './solar-panel-array.dto';
import { StorageDto } from './storage.dto';
import { SoftCostDto } from './soft-cost.dto';
import { LaborCostDto } from './labor-cost.dto';

export class RoofTopDataDto {
  @ExposeProp({
    type: SolarPanelArrayDto,
    isArray: true,
  })
  panelArray: SolarPanelArrayDto[];

  @ExposeAndMap(
    {
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
      skipTransform: true,
    },
    ({ obj }) => obj.keepouts,
  )
  keepouts: LatLng[][];

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

  @ExposeProp({
    type: LaborCostDto,
    isArray: true,
  })
  laborCosts: LaborCostDto[];
}

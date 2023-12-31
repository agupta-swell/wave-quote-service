import { Expose, Transform } from 'class-transformer';
import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';
import { RoofTopImageResDto } from './roof-top-image.dto';
import { AdderDto } from './adder.dto';
import { AncillaryEquipmentDto } from './ancillary-equipment.dto';
import { BalanceOfSystemDto } from './balance-of-system.dto';
import { InverterDto } from './inverter.dto';
import { LaborCostDto } from './labor-cost.dto';
import { SoftCostDto } from './soft-cost.dto';
import { LatLng, SolarPanelArrayDto } from './solar-panel-array.dto';
import { StorageDto } from './storage.dto';

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

  @ExposeProp()
  hasSunroofIrradiance: boolean;

  @ExposeProp({ type: RoofTopImageResDto, required: false })
  roofTopImage: RoofTopImageResDto;

  constructor() {
    Object.assign(this, { entity: { name: 'name' } });
  }
}

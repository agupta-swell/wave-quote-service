import { ExposeProp } from 'src/shared/decorators';
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
}

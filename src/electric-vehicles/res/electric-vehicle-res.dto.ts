import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { IElectricVehicle } from '../interfaces';

export class ElectricVehicleResDto implements IElectricVehicle {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  manufacturer: string;

  @ExposeProp()
  model: string;

  @ExposeProp()
  batteryKwh: number;

  @ExposeProp()
  mpge: number;

  @ExposeProp()
  createdAt: Date;

  @ExposeProp()
  createdBy: string;

  @ExposeProp()
  updatedAt: Date;

  @ExposeProp()
  updatedBy: string;
}

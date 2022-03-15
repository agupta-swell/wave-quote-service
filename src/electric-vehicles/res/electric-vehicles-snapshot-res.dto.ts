import { ExposeProp } from 'src/shared/decorators';
import { ElectricVehicleResDto } from '.';
import { IChargerType, IElectricVehicleSnapshot } from '../interfaces';

export class ChargerTypeResDto implements IChargerType {
  @ExposeProp()
  name: string;

  @ExposeProp()
  rating: number;
}

export class ElectricVehicleSnapshotResDto implements IElectricVehicleSnapshot {
  @ExposeProp()
  electricVehicleId: string;

  @ExposeProp()
  electricVehicleSnapshotDate: Date;

  @ExposeProp({ type: ElectricVehicleResDto })
  electricVehicleSnapshot: ElectricVehicleResDto;

  @ExposeProp()
  milesDrivenPerDay: number;

  @ExposeProp()
  startChargingHour: number;

  @ExposeProp({ type: ChargerTypeResDto })
  chargerType: ChargerTypeResDto;
}

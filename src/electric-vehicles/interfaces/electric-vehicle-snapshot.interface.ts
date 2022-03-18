import { IElectricVehicle } from './electric-vehicle.interface';

export interface IChargerType {
  name: string;
  rating: number;
}

export interface IAdditionalElectricVehicleProps {
  milesDrivenPerDay: number;
  startChargingHour: number;
  chargerType: IChargerType;
}

export type WithAdditionalElectricVehicleProps<T> = T & IAdditionalElectricVehicleProps;

export interface IElectricVehicleSnapshot extends IAdditionalElectricVehicleProps {
  electricVehicleId: string;
  electricVehicleSnapshotDate: Date;
  electricVehicleSnapshot: IElectricVehicle;
}

export type WithElectricVehicles<T> = T & {
  electricVehicles: IElectricVehicleSnapshot[];
};

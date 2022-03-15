import { Document } from 'mongoose';

export interface IElectricVehicle {
  manufacturer: string;
  model: string;
  batteryKwh: number;
  mpge: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export type ElectricVehicleDocument = Document & IElectricVehicle;

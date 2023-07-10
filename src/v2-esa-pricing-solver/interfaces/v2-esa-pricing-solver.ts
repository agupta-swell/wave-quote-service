import { Document } from 'mongoose';

export interface V2EsaPricingSolver {
  termYears: number;
  storageSizeKWh: number;
  storageManufacturerId: string;
  state: string;
  applicableUtilities: string[];
  projectTypes: string[];
  rateEscalator: number;
  coefficientA: number;
  coefficientB: number;
  coefficientC: number;
  coefficientD: number;
  maxPricePerWatt: number;
  minPricePerWatt: number;
  maxDollarKwhRate: number;
  minDollarKwhRate: number;
  maxPricePerKwh: number;
  minPricePerKwh: number;
}

export type V2EsaPricingSolverDocument = V2EsaPricingSolver & Document;

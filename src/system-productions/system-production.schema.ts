import { Document, Schema } from 'mongoose';
import { CreateSystemProductionDto } from './req';

export const SYSTEM_PRODUCTION = Symbol('SYSTEM_PRODUCTION').toString();

export interface IEnergyProfileProduction {
  annualAverage: number[];
  monthlyAverage: number[][];
}

export interface ISystemProduction extends Document {
  capacityKW: number;
  generationKWh: number;
  productivity: number;
  annualUsageKWh: number;
  offsetPercentage: number;
  generationMonthlyKWh: number[];
  arrayGenerationKWh: number[];
  pvWattProduction: IEnergyProfileProduction;
  createdAt: Date;
}

export const SystemProductionSchema = new Schema<ISystemProduction>({
  capacityKW: Number,
  generationKWh: Number,
  productivity: Number,
  annual_usageKWh: Number,
  offset_percentage: Number,
  generation_monthlyKWh: [Number],
  array_generationKWh: [Number],
  pv_watt_production: new Schema(
    {
      annual_average: [Number],
      monthly_average: [[Number]],
    },
    { _id: false },
  ),
  created_at: { type: Date, default: Date.now },
});

export class SystemProductionModel {
  _id: string;

  capacityKW: number;

  generationKWh: number;

  productivity: number;

  annualUsageKWh: number;

  offsetPercentage: number;

  generationMonthlyKWh: number[];

  arrayGenerationKWh: number[];

  pvWattProduction: IEnergyProfileProduction;

  createdAt: Date;

  constructor(systemProduction: CreateSystemProductionDto) {
    this.capacityKW = systemProduction.capacityKW;
    this.generationKWh = systemProduction.generationKWh;
    this.productivity = systemProduction.productivity;
    this.annualUsageKWh = systemProduction.annualUsageKWh;
    this.offsetPercentage = systemProduction.offsetPercentage;
    this.generationMonthlyKWh = systemProduction.generationMonthlyKWh;
    this.arrayGenerationKWh = systemProduction.arrayGenerationKWh;
    this.pvWattProduction = systemProduction.pvWattProduction;
  }

  setCapacityKW(data: number) {
    this.capacityKW = data;
  }

  setGenerationKWh(data: number) {
    this.generationKWh = data;
  }

  setProductivity(data: number) {
    this.productivity = data;
  }

  setAnnualUsageKWh(data: number) {
    this.annualUsageKWh = data;
  }

  setOffsetPercentage(data: number) {
    this.offsetPercentage = data;
  }

  setGenerationMonthlyKWh(data: number[]) {
    this.generationMonthlyKWh = data;
  }

  setArrayGenerationKWh(data: number[]) {
    this.arrayGenerationKWh = data;
  }

  setHourlyProduction(data: IEnergyProfileProduction) {
    this.pvWattProduction = data;
  }
}

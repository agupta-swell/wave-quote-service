import { Document, Schema } from 'mongoose';
import { CreateSystemProductionDto } from './req';

export const SYSTEM_PRODUCTION = Symbol('SYSTEM_PRODUCTION').toString();

export interface ISystemProduction extends Document {
  capacityKW: number;
  generationKWh: number;
  productivity: number;
  annualUsageKWh: number;
  offsetPercentage: number;
  generationMonthlyKWh: number[];
  arrayGenerationKWh: number[];
  hourlyProduction: string;
}

export const SystemProductionSchema = new Schema<ISystemProduction>({
  capacityKW: Number,
  generationKWh: Number,
  productivity: Number,
  annual_usageKWh: Number,
  offset_percentage: Number,
  generation_monthlyKWh: [Number],
  array_generationKWh: [Number],
  hourly_production: String,
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

  hourlyProduction: string;

  constructor(systemProduction: CreateSystemProductionDto) {
    this.capacityKW = systemProduction.capacityKW;
    this.generationKWh = systemProduction.generationKWh;
    this.productivity = systemProduction.productivity;
    this.annualUsageKWh = systemProduction.annualUsageKWh;
    this.offsetPercentage = systemProduction.offsetPercentage;
    this.generationMonthlyKWh = systemProduction.generationMonthlyKWh;
    this.arrayGenerationKWh = systemProduction.arrayGenerationKWh;
    this.hourlyProduction = systemProduction.hourlyProduction;
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

  setHourlyProduction(data: string) {
    this.hourlyProduction = data;
  }
}

import { Document, Schema } from 'mongoose';

export const PV_WATT_SYSTEM_PRODUCTION = Symbol('PV_WATT_SYSTEM_PRODUCTION').toString();

export interface PvWattSystemProduction extends Document {
  lat: number;
  lon: number;
  system_capacity_kW: number;
  azimuth: number;
  tilt: number;
  array_type: number;
  module_type: number;
  losses: number;
  ac_annual_hourly_production: number[];
  ac_monthly_production: number[];
  ac_annual_production: number;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const PvWattSystemProductionSchema = new Schema<PvWattSystemProduction>({
  lat: Number,
  lon: Number,
  system_capacity_kW: Number,
  azimuth: Number,
  tilt: Number,
  array_type: Number,
  module_type: Number,
  losses: Number,
  ac_annual_hourly_production: [Number],
  ac_monthly_production: [Number],
  ac_annual_production: Number,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

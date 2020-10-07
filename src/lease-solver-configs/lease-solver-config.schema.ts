import { Document, Schema } from 'mongoose';

export const LEASE_SOLVER_CONFIG = Symbol('LEASE_SOLVER_CONFIG').toString();

export interface LeaseSolverConfig extends Document {
  is_solar: boolean;
  is_retrofit: boolean;
  utility_program_name: string;
  contract_term: number;
  storageSize: number;
  solar_size_minimum: number;
  solar_size_maximum: number;
  adjusted_install_cost: number;
  rate_factor: number;
  productivity_min: number;
  productivity_max: number;
  rate_escalator: number;
  rate_per_kWh: number;
  storage_payment: number;
  grid_services_discount: number;
}

export const LeaseSolverConfigSchema = new Schema<LeaseSolverConfig>({
  is_solar: Boolean,
  is_retrofit: Boolean,
  utility_program_name: String,
  contract_term: Number,
  storageSize: Number,
  solar_size_minimum: Number,
  solar_size_maximum: Number,
  adjusted_install_cost: Number,
  rate_factor: Number,
  productivity_min: Number,
  productivity_max: Number,
  rate_escalator: Number,
  rate_per_kWh: Number,
  storage_payment: Number,
  grid_services_discount: Number,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

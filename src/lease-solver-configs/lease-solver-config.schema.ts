import { Document, Schema } from 'mongoose';

export const LEASE_SOLVER_CONFIG = Symbol('LEASE_SOLVER_CONFIG').toString();

export interface LeaseSolverConfig extends Document {
  isSolar: boolean;
  isRetrofit: boolean;
  utilityProgramName: string;
  contractTerm: number;
  storageSize: number;
  solarSizeMinimum: number;
  solarSizeMaximum: number;
  adjustedInstallCost: number;
  rateFactor: number;
  productivityMin: number;
  productivityMax: number;
  rateEscalator: number;
  ratePerKWh: number;
  storagePayment: number;
  gridServicesDiscount: number;
}

export const LeaseSolverConfigSchema = new Schema<LeaseSolverConfig>({
  is_solar: Boolean,
  is_retrofit: Boolean,
  utility_program_name: String,
  contract_term: Number,
  storage_size: Number,
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

import { Document, Schema } from 'mongoose';
import { RATE_NAME_TYPE } from '../constants';

export const SAVING_ENGINE_SCENARIO = Symbol('SAVING_ENGINE_SCENARIO').toString();

export interface SavingEngineScenario extends Document {
  scenario_id: string;
  location: string;
  storage_rate_type: RATE_NAME_TYPE;
  // todo: fix typing later
  battery: string;
  battery_count: number;
  bau_rate: RATE_NAME_TYPE;
  pv_rate: RATE_NAME_TYPE;
  annual_load: number;
  pv_capacity: number;
  charge_from_grid_max_percentage: number;
  financial_dict: string | null;
  grid_services: string;
  sgip: boolean | null;
  grid_service_days: number | null;
  export_limit: number | null;
}

export const SavingEngineScenarioSchema = new Schema<SavingEngineScenario>({
  scenario_id: String,
  location: String,
  storage_rate_type: String,
  // todo: fix typing later
  battery: String,
  battery_count: Number,
  bau_rate: String,
  pv_rate: String,
  annual_load: Number,
  pv_capacity: Number,
  charge_from_grid_max_percentage: Number,
  financial_dict: String,
  grid_services: String,
  sgip: Boolean,
  grid_service_days: Number,
  export_limit: Number,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

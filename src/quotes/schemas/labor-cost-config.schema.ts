import { Schema } from 'mongoose';

export const LABOR_COST_CONFIG = Symbol('LABOR_COST_CONFIG').toString();

export interface LaborCostConfig extends Document {
  calculationType: string;
  unit: string;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const LaborCostConfigSchema = new Schema<LaborCostConfig>({
  calculationType: String,
  unit: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

import { Document, Schema } from 'mongoose';
import { CALCULATION_TYPE, RATE_NAME_TYPE, SCENARIO_TYPE } from '../constants';

export const SAVING_ENGINE_BILL = Symbol('SAVING_ENGINE_BILL').toString();

export interface SavingEngineBill extends Document {
  year_month: Date;
  scenario_id: string;
  cost: number;
  calculation_type: CALCULATION_TYPE;
  scenario_type: SCENARIO_TYPE;
  rate_name_type: RATE_NAME_TYPE;
}

export const SavingEngineBillSchema = new Schema<SavingEngineBill>({
  year_month: Date,
  scenario_id: String,
  cost: Number,
  calculation_type: String,
  scenario_type: String,
  rate_name_type: String,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

import { Document, Schema } from 'mongoose';
import { CALCULATION_TYPE, RATE_NAME_TYPE, SCENARIO_TYPE } from '../constants';

export const SAVING_ENGINE_BILL = Symbol('SAVING_ENGINE_BILL').toString();

export interface SavingEngineBill extends Document {
  yearMonth: Date;
  scenarioId: string;
  cost: number;
  calculationType: CALCULATION_TYPE;
  scenarioType: SCENARIO_TYPE;
  rateNameType: RATE_NAME_TYPE;
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

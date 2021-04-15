import { Document, Schema } from 'mongoose';
import {} from 'dayjs'

export const UTILITY_PROGRAM_MASTER = Symbol('UTILITY_PROGRAM_MASTER').toString();

export interface UtilityProgramMaster extends Document {
  utility_program_name: string;
  rebate_amount: number;

  gsa_display_name: string;
  is_active: boolean;
  end_date: string;
}

export const UtilityProgramMasterSchema = new Schema<UtilityProgramMaster>({
  utility_program_name: String,
  rebate_amount: Number,

  gsa_display_name: String,
  is_active: Boolean,
  end_date: Date,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

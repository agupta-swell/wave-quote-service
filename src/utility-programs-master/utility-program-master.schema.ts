import { Document, Schema } from 'mongoose';

export const UTILITY_PROGRAM_MASTER = Symbol('UTILITY_PROGRAM_MASTER').toString();

export interface UtilityProgramMaster extends Document {
  utility_program_name: string;
  rebate_amount: number;
}

export const UtilityProgramMasterSchema = new Schema<UtilityProgramMaster>({
  utility_program_name: String,
  rebate_amount: Number,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

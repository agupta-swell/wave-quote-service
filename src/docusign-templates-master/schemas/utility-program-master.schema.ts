import { Document, Schema } from 'mongoose';

export const UTILITY_PROGRAM_MASTER = Symbol('UTILITY_PROGRAM_MASTER').toString();

export interface UtilityProgramMaster extends Document {
  utility_program_name: string;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const UtilityProgramMasterSchema = new Schema<UtilityProgramMaster>({
  utility_program_name: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

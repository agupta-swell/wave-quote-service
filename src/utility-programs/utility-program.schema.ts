import { Document, Schema } from 'mongoose';

export const UTILITY_PROGRAM = Symbol('UTILITY_PROGRAM').toString();

export interface UtilityProgram extends Document {
  name: string;
}

export const UtilityProgramSchema = new Schema<UtilityProgram>({
  name: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

import { Document, Schema } from 'mongoose';

export const UTILITY_MASTER = Symbol('UTILITY_MASTER').toString();

export interface UtilityMaster extends Document {
  utility_name: string;
  lse_id: string;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const UtilityMasterSchema = new Schema<UtilityMaster>({
  utility_name: String,
  lse_id: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

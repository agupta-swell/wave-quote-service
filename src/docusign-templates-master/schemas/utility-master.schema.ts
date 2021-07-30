import { Document, Schema } from 'mongoose';

export const UTILITY_MASTER = Symbol('UTILITY_MASTER').toString();

export interface UtilityMaster extends Document {
  utilityName: string;
  lseId: string;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export const UtilityMasterSchema = new Schema<UtilityMaster>({
  utility_name: String,
  lse_id: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

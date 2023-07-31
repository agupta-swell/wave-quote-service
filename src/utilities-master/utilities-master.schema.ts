import { Document, Schema } from 'mongoose';

export const UTILITIES_MASTER = Symbol('UTILITIES_MASTER').toString();

export interface UtilitiesMaster extends Document {
  utilityName: string;
  createdAt: string;
  updatedAt: string;
}

export const UtilitiesMasterSchema = new Schema<UtilitiesMaster>({
  utility_name: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

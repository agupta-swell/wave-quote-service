import { Document, Schema, Types } from 'mongoose';

export const SOILING_DERATE = Symbol('SOILING_DERATE').toString();

export interface SoilingDerate extends Document {
  regionId: Types.ObjectId;
  amounts: number[];
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export const SoilingDerateSchema = new Schema<SoilingDerate>({
  region_id: Types.ObjectId,
  amounts: [Number],
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

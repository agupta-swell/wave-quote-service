import { Document, Schema, Types } from 'mongoose';

export const SNOW_DERATE = Symbol('SNOW_DERATE').toString();

export interface SnowDerate extends Document {
  regionId: Types.ObjectId;
  amounts: number[];
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export const SnowDerateSchema = new Schema<SnowDerate>({
  region_id: Types.ObjectId,
  amounts: [Number],
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

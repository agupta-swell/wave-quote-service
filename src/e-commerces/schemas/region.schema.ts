import { Document, Schema } from 'mongoose';

export const REGION = Symbol('REGION').toString();

export interface Region extends Document {
  region_description: string;

  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const RegionSchema = new Schema<Region>({
  region_description: String,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

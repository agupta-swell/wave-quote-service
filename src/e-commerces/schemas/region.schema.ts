import { Document, Schema } from 'mongoose';

export const REGION = Symbol('REGION').toString();

export interface Region extends Document {
  regionDescription: string;

  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export const RegionSchema = new Schema<Region>({
  region_description: String,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

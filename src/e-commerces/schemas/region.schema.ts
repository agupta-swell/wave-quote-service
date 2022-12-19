import { Document, Schema } from 'mongoose';

export const REGION = Symbol('REGION').toString();

export enum REGION_PURPOSE {
  ECOMM = 'ecomm',
  SOILING = 'soiling',
}

export interface Region extends Document {
  name: string;
  regionPurpose: REGION_PURPOSE;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export const RegionSchema = new Schema<Region>({
  name: String,
  region_purpose: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

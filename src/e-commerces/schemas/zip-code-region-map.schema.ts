import { Document, Schema } from 'mongoose';

export const ZIP_CODE_REGION_MAP = Symbol('ZIP_CODE_REGION_MAP').toString();

export interface ZipCodeRegionMap extends Document {
  regionId: string;
  zipCodes: number[];

  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export const ZipCodeRegionMapSchema = new Schema<ZipCodeRegionMap>({
  region_id: String,
  zip_codes: [Number],

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

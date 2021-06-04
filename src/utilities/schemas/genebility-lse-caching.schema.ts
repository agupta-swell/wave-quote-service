import { Document, Schema } from 'mongoose';

export const GENEBILITY_LSE_DATA = 'v2_genability_lse_data';

export const GenebilityLseDataDetailSchema = new Schema(
  {
    lse_name: String,
    lse_code: String,
    service_type: String,
    lse_id: String,
  },
  {
    _id: false,
  },
);

export const GenebilityLseDataSchema = new Schema({
  zip_code: Number,
  data: [GenebilityLseDataDetailSchema],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export interface GenebilityLseDataDetail extends Document {
  zipCode: number;
  lseName: string;
  lseCode: string;
  serviceType: string;
  lseId: string;
}

export interface GenebilityLseData extends Document {
  zipData: number;
  data: GenebilityLseDataDetail[];
}

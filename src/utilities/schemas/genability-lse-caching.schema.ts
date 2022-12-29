import { Document, Schema } from 'mongoose';

export const GENABILITY_LSE_DATA = 'v2_genability_lse_data';

export const GenabilityLseDataDetailSchema = new Schema(
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

export const GenabilityLseDataSchema = new Schema({
  zip_code: Number,
  data: [GenabilityLseDataDetailSchema],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export interface GenabilityLseDataDetail extends Document {
  zipCode: number;
  lseName: string;
  lseCode: string;
  serviceType: string;
  lseId: string;
}

export interface GenabilityLseData extends Document {
  zipData: number;
  data: GenabilityLseDataDetail[];
}

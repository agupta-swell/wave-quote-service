import { Document, Schema } from 'mongoose';

export const ESA_PAYMENT_CONFIG = Symbol('ESA_PAYMENT_CONFIG').toString();

export interface IMilestonePaymentConfigSchema extends Document {
  name: string;
  percentage: number;
}

const MilestonePaymentConfigSchema = new Schema<IMilestonePaymentConfigSchema>(
  {
    name: String,
    percentage: Number,
  },
  { _id: false },
);

export interface EsaPaymentConfig extends Document {
  type: string;
  config: IMilestonePaymentConfigSchema[];
}

export const EsaPaymentConfigSchema = new Schema<EsaPaymentConfig>({
  type: String,
  config: [MilestonePaymentConfigSchema],
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

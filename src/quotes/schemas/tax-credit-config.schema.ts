import { Document, Schema } from 'mongoose';

export const TAX_CREDIT_CONFIG = Symbol('TAX_CREDIT_CONFIG').toString();

export interface TaxCreditConfig extends Document {
  name: string;
  percentage: number;
  start_date: Date;
  end_date: Date;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const TaxCreditConfigSchema = new Schema<TaxCreditConfig>({
  name: String,
  percentage: Number,
  start_date: Date,
  end_date: Date,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

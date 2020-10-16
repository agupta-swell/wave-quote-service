import { Schema } from 'mongoose';

export const TAX_CREDIT_CONFIG = Symbol('TAX_CREDIT_CONFIG').toString();

export interface TaxCreditConfig extends Document {
  name: string;
  tax_credit_precentage: number;
  tax_credit_start_date: Date;
  tax_credit_end_date: Date;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const TaxCreditConfigSchema = new Schema<TaxCreditConfig>({
  name: String,
  tax_credit_precentage: Number,
  tax_credit_start_date: Date,
  tax_credit_end_date: Date,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

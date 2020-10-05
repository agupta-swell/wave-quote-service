import { Document, Schema } from 'mongoose';

export const FUNDING_SOURCE = Symbol('FUNDING_SOURCE').toString();

export interface FundingSource extends Document {
  _id: string;
  name: string;
  isTrancheApplicable: string;
  type: string;
}

export const FundingSourceSchema = new Schema<FundingSource>({
  _id: String,
  name: String,
  isTrancheApplicable: String,
  type: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

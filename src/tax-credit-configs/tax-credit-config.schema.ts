import { Schema } from 'mongoose';
import { ITaxCreditConfigDocument, ITaxCreditConfigSnapshotDocument } from './interfaces';

export const TaxCreditConfigSchema = new Schema<ITaxCreditConfigDocument>({
  name: String,
  percentage: Number,
  start_date: Date,
  end_date: Date,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

export const TaxCreditConfigSnapshotSchema = new Schema<ITaxCreditConfigSnapshotDocument>(
  {
    name: String,
    percentage: Number,
    value: Number,
    tax_credit_config_data_id: String,
    tax_credit_config_data_snapshot: new Schema(TaxCreditConfigSchema.obj, { _id: false }),
    tax_credit_config_data_snapshot_date: Date,
  },
  {
    _id: false,
  },
);

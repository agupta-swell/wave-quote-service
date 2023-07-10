import { Schema } from 'mongoose';
import { V2EsaPricingSolverDocument } from './interfaces';

export const V2EsaPricingSolverSchema = new Schema<V2EsaPricingSolverDocument>(
  {
    term_years: Number,
    storage_size_kWh: Number,
    storage_manufacturer_id: String,
    state: String,
    applicable_utilities: [String],
    project_types: [String],
    rate_escalator: Number,
    coefficient_a: Number,
    coefficient_b: Number,
    coefficient_c: Number,
    coefficient_d: Number,
    max_price_per_watt: Number,
    min_price_per_watt: Number,
    max_dollar_kwh_rate: Number,
    min_dollar_kwh_rate: Number,
    max_price_per_kwh: Number,
    min_price_per_kwh: Number,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

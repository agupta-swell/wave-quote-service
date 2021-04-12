import { Document, Schema, Types } from 'mongoose';

export const E_COMMERCE_CONFIG = Symbol('E_COMMERCE_CONFIG').toString();

export interface ECommerceConfig extends Document {
  region_id: Types.ObjectId;
  design_factor: number;
  module_price_per_watt: number;
  storage_price: number;
  labor_cost_perWatt: number;
  loan_interest_rate: number;
  loan_terms_in_months: number;
  esa_rate_escalator: number;
  esa_contract_term_in_years: number;
  esa_utility_program_name: string;
  
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const ECommerceConfigSchema = new Schema<ECommerceConfig>({
  region_id: Schema.Types.ObjectId,
  design_factor: Number,
  module_price_per_watt: Number,
  storage_price: Number,
  labor_cost_perWatt: Number,
  loan_interest_rate: Number,
  loan_terms_in_months: Number,
  esa_rate_escalator: Number,
  esa_contract_term_in_years: Number,
  esa_utility_program_name: String,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

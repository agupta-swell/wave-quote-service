import { Document, Schema } from 'mongoose';

export const QUOTE_PARTNER_CONFIG = Symbol('QUOTE_PARTNER_CONFIG').toString();

export interface QuotePartnerConfig extends Document {
  partner_id: string;
  enable_cost_build_up: boolean;
  enable_price_per_watt: boolean;
  enable_price_override_mode: boolean;
  enable_module_dc_clipping: boolean;
  price_per_watt: number;
  default_dc_clipping: number;
  max_module_dc_clipping: number;
  solar_only_labor_fee_per_watt: number;
  storage_retrofit_labor_fee_per_project: number;
  solar_with_ac_storage_labor_fee_per_project: number;
  solar_with_dc_storage_labor_fee_per_project: number;
  swell_standard_markup: number;

  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const QuotePartnerConfigSchema = new Schema<QuotePartnerConfig>({
  partner_id: String,
  enable_cost_build_up: Boolean,
  enable_price_per_watt: Boolean,
  enable_price_override_mode: Boolean,
  enable_module_dc_clipping: Boolean,
  price_per_watt: Number,
  default_dc_clipping: Number,
  max_module_dc_clipping: Number,
  solar_only_labor_fee_per_watt: Number,
  storage_retrofit_labor_fee_per_project: Number,
  solar_with_ac_storage_labor_fee_per_project: Number,
  solar_with_dc_storage_labor_fee_per_project: Number,
  swell_standard_markup: Number,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

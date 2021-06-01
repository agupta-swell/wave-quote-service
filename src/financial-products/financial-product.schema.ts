import { Document, Schema } from 'mongoose';
import { FINANCIER_COLLECTION } from '../financier/financier.constant';

export const FINANCIAL_PRODUCT = Symbol('FINANCIAL_PRODUCT').toString();

export interface FinancialProduct extends Document {
  funding_source_id: string;
  is_active: boolean;
  name: string;
  fund_id: string;
  allow_down_payment: boolean;
  min_down_payment: number;
  default_down_payment: number;
  max_down_payment: number;
  annual_degradation: number;
  guaranteed_production: number;
  min_margin: number;
  max_margin: number;
  min_system_kw: number;
  max_system_kw: number;
  min_battery_kwh: number;
  max_battery_kwh: number;
  min_productivity: number;
  max_productivity: number;
  allowed_states: string[];
  interest_rate: number;
  term_months: number;
  dealer_fee: number;
  financier_id: string;
}

export const FinancialProductSchema = new Schema<FinancialProduct>({
  _id: Schema.Types.Mixed,
  funding_source_id: String,
  is_active: Boolean,
  name: String,
  fund_id: String,
  allow_down_payment: Boolean,
  min_down_payment: Number,
  default_down_payment: Number,
  max_down_payment: Number,
  annual_degradation: Number,
  guaranteed_production: Number,
  min_margin: Number,
  max_margin: Number,
  min_system_kw: Number,
  max_system_kw: Number,
  min_battery_kwh: Number,
  max_battery_kwh: Number,
  min_productivity: Number,
  max_productivity: Number,
  allowed_states: [String],
  interest_rate: Number,
  term_months: Number,
  dealer_fee: Number,
  financier_id: {
    type: Schema.Types.ObjectId,
    // required: true,
  },
});

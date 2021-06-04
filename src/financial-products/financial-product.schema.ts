import { Document, Schema } from 'mongoose';

export const FINANCIAL_PRODUCT = Symbol('FINANCIAL_PRODUCT').toString();

export interface FinancialProduct extends Document {
  fundingSourceId: string;
  isActive: boolean;
  name: string;
  fundId: string;
  allowDownPayment: boolean;
  minDownPayment: number;
  defaultDownPayment: number;
  maxDownPayment: number;
  annualDegradation: number;
  guaranteedProduction: number;
  minMargin: number;
  maxMargin: number;
  minSystemKw: number;
  maxSystemKw: number;
  minBatteryKwh: number;
  maxBatteryKwh: number;
  minProductivity: number;
  maxProductivity: number;
  allowedStates: string[];
  interestRate: number;
  termMonths: number;
  dealerFee: number;
  financierId: string;
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

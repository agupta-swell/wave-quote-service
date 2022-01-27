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
  maxDownPaymentPercentage: number;
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
  minBatteryReserve: number;
  maxBatteryReserve: number;
  minClippingRatio: number;
  maxClippingRatio: number;
  minMarkup: number;
  maxMarkup: number;
  requiresHardCreditApproval: boolean;
  countersignerName: string;
  countersignerTitle: string;
  countersignerEmail: string;
  allowsWetSignedContracts: boolean;
  projectCompletionDateOffset: number;
  processingFee: number;
  payment1?: number;
  payment1PayPercent?: boolean;
}

export const FinancialProductSchema = new Schema<FinancialProduct>({
  _id: {
    type: Schema.Types.Mixed,
    alias: 'id',
  },
  funding_source_id: String,
  is_active: Boolean,
  name: String,
  fund_id: String,
  allow_down_payment: Boolean,
  min_down_payment: Number,
  default_down_payment: Number,
  max_down_payment: Number,
  max_down_payment_percentage: Number,
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
  min_battery_reserve: Number,
  max_battery_reserve: Number,
  min_clipping_ratio: Number,
  max_clipping_ratio: Number,
  min_markup: Number,
  max_markup: Number,
  allowed_states: [String],
  interest_rate: Number,
  term_months: Number,
  dealer_fee: Number,
  financier_id: {
    type: Schema.Types.ObjectId,
    // required: true,
  },
  countersigner_name: String,
  countersigner_title: String,
  countersigner_email: String,
  requires_hard_credit_approval: Boolean,
  allows_wet_signed_contracts: Boolean,
  project_completion_date_offset: Number,
  processing_fee: Number,
  payment1: Number,
  payment1_pay_percent: Boolean,
});

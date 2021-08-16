import { Document, Schema, Types } from 'mongoose';

export const E_COMMERCE_CONFIG = Symbol('E_COMMERCE_CONFIG').toString();

export interface IRetrofitStoragePriceSchema extends Document {
  batteryCount: number;
  cost: number;
}

const RetrofitStoragePriceSchema = new Schema<IRetrofitStoragePriceSchema>(
  {
    battery_count: Number,
    cost: Number,
  },
  { _id: false },
);

export interface ECommerceConfig extends Document {
  regionId: Types.ObjectId;
  designFactor: number;
  modulePricePerWatt: number;
  moduleLaborPerWatt: number;
  moduleMarkup: number;
  storagePrice: number;
  storageBaseCost: number;
  storageLaborPerHour: number;
  storageMarkup: number;
  loanInterestRate: number;
  loanTermsInMonths: number; 
  loanDealerFee: number;
  esaRateEscalator: number;
  esaContractTermInYears: number;
  esaUtilityProgramName: string;
  retrofitStoragePrices: IRetrofitStoragePriceSchema[];
  
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export const ECommerceConfigSchema = new Schema<ECommerceConfig>({
  region_id: Schema.Types.ObjectId,
  design_factor: Number,
  module_price_per_watt: Number,
  module_labor_per_watt: Number,
  module_markup: Number,
  storage_price: Number,
  storage_base_cost: Number,
  storage_labor_per_hour: Number,
  storage_markup: Number,
  loan_interest_rate: Number,
  loan_terms_in_months: Number,
  loan_dealer_fee: Number,
  esa_rate_escalator: Number,
  esa_contract_term_in_years: Number,
  esa_utility_program_name: String,
  es_markup: Number,
  retrofit_storage_prices: [RetrofitStoragePriceSchema],

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

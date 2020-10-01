import { Document, Schema } from 'mongoose';
import { ISystemProductionSchema, SystemProductionSchema } from 'src/system-designs/system-design.schema';
import { toSnakeCase } from 'src/utils/transformProperties';
import { CreateQuoteDto } from './req/create-quote.dto';

export const QUOTE = Symbol('QUOTE').toString();

export interface IIncentiveDetailsSchema {
  unit: string;
  unit_value: number;
  type: string;
  applies_to: string;
  description: string;
}

const IncentiveDetailsSchema = new Schema<IIncentiveDetailsSchema>(
  {
    unit: String,
    unit_value: Number,
    type: String,
    applies_to: String,
    description: String,
  },
  { _id: false },
);

export interface IRebateDetailsSchema {
  amount: number;
  type: string;
  description: string;
}

const RebateDetailsSchema = new Schema<IRebateDetailsSchema>(
  {
    amount: Number,
    type: String,
    description: String,
  },
  { _id: false },
);

export interface IMonthlyLoanPaymentDetails {
  month: number;
  payment_amount: number;
  current_interest: number;
  principal: number;
  principal_prepayment: number;
}

export interface IYearlyLoanPaymentDetails {
  year: number;
  monthly_payment_details: IMonthlyLoanPaymentDetails[];
}

export interface ILoanProductAttributes {
  upfront_payment: number;
  loan_amount: number;
  interest_rate: number;
  loan_term: number;
  tax_credit_prepayment_amount: number;
  willing_to_pay_through_ach: boolean;
  monthly_loan_payment: number;
  current_monthly_average_utility_payment: number;
  monthly_utility_payment: number;
  grid_service_payment: number;
  net_customer_energy_spend: number;
  return_on_investment: number;
  pay_back_period: number;
  current_price_per_kWh: number;
  new_price_per_kWh: number;
  yearly_loan_payment_details: IYearlyLoanPaymentDetails[];
}

export interface IMonthlyLeasePaymentDetails {
  month: number;
  payment_amount: number;
  pv: number;
  es: number;
}

export interface IYearlyLeasePaymentDetails {
  year: number;
  monthly_payment_details: IMonthlyLeasePaymentDetails[];
}

export interface ILeaseProductAttributes {
  upfront_payment: number;
  lease_amount: number;
  rate_escalator: number;
  lease_term: number;
  monthly_lease_payment: number;
  current_monthly_average_utility_payment: number;
  monthly_utility_payment: number;
  monthly_energy_payment: number;
  grid_service_payment: number;
  net_customer_energy_spend: number;
  current_price_per_kWh: number;
  new_price_per_kWh: number;
  yearly_lease_payment_details: IYearlyLeasePaymentDetails[];
}

export interface IMilestonePayment {
  name: string;
  amount: number;
  percentage: number;
}

export interface ICashQuoteConfigSnapshot {
  type: string;
  config: {
    amount: number;
    percentage: number;
  }[];
}

export interface ICashProductAttributes {
  upfront_payment: number;
  balance: number;
  milestone_payment: IMilestonePayment[];
  cash_quote_config_snapshot: ICashQuoteConfigSnapshot;
  cash_quote_config_snapshot_date: Date;
  current_average_monthly_bill: number;
  new_average_monthly_bill: number;
  current_price_per_kWh: number;
  new_price_per_kWh: number;
}

export interface IFinaceProductSchema {
  product_type: string;
  funding_source_id: string;
  funding_source_name: string;
  product_attribute: ILoanProductAttributes | ILeaseProductAttributes | ICashProductAttributes;
}

const FinaceProductSchema = new Schema<IFinaceProductSchema>(
  {
    product_type: String,
    funding_source_id: String,
    funding_source_name: String,
    product_attribute: Schema.Types.Mixed,
  },
  { _id: false },
);

export interface IProjectDiscountDetailSchema {
  unit: string;
  unit_value: number;
  exclude_adders: boolean;
  description: string;
}

const ProjectDiscountDetailSchema = new Schema<IProjectDiscountDetailSchema>(
  {
    unit: String,
    unit_value: Number,
    exclude_adders: Boolean,
    description: String,
  },
  { _id: false },
);

export interface IQuoteFinanceProductSchema {
  finace_product: IFinaceProductSchema;
  net_amount: number;
  incentive_details: IIncentiveDetailsSchema[]; ///////////////////////////////////////////////
  rebate_details: IRebateDetailsSchema[];
  project_discount_details: IProjectDiscountDetailSchema[];
}

const QuoteFinanceProductSchema = new Schema<IQuoteFinanceProductSchema>(
  {
    finace_product: FinaceProductSchema,
    incentive_details: [IncentiveDetailsSchema],
    rebate_details: [RebateDetailsSchema],
    net_amount: Number,
    project_discount_details: [ProjectDiscountDetailSchema],
  },
  { _id: false },
);

export interface IUtilityProgramSchema {
  utility_program_id: number;
  utility_program_name: string;
}

const UtilityProgramSchema = new Schema<IUtilityProgramSchema>(
  {
    utility_program_id: Number,
    utility_program_name: String,
  },
  { _id: false },
);

export interface ISavingsDetailsSchema {
  year: number;
  current_utility_bill: number;
  new_utility_bill: number;
  payment: number;
  discount_and_incentives: number;
  annual_saving: number;
}

const SavingsDetailsSchema = new Schema<ISavingsDetailsSchema>({
  year: Number,
  current_utility_bill: Number,
  new_utility_bill: Number,
  payment: Number,
  discount_and_incentives: Number,
  annual_saving: Number,
});

export interface IDiscountDetailSchema {
  amount: number;
  description: string;
}

const DiscountDetailSchema = new Schema<IDiscountDetailSchema>({
  amount: Number,
  description: String,
});

export interface ILaborCostSchema {
  labor_cost_data_snapshot: { calculation_type: string; unit: string };
  labor_cost_snapshot_date: Date;
  cost: number;
  markup: number;
  discount_details: IDiscountDetailSchema[];
  netCost: number;
}

const LaborCostSchema = new Schema<ILaborCostSchema>({
  labor_cost_data_snapshot: new Schema({ calculation_type: String, unit: String }),
  labor_cost_snapshot_date: Date,
  cost: Number,
  markup: Number,
  discount_details: [DiscountDetailSchema],
  netCost: Number,
});

// TODO: implement tomorrow
export interface IQuoteCostBuildupSchema {
  overall_markup: number;
  total_product_cost: number;
  labor_cost: ILaborCostSchema;
  gross_amount: number;
}

const QuoteCostBuildupSchema = new Schema<IQuoteCostBuildupSchema>({
  overall_markup: Number,
  total_product_cost: Number,
  labor_cost: LaborCostSchema,
  gross_amount: Number,
});

export interface IDetailedQuoteSchema {
  system_production: ISystemProductionSchema;
  utility_program: IUtilityProgramSchema;
  quote_finance_product: IQuoteFinanceProductSchema; //////////////////////////////////////////
  savings_details: ISavingsDetailsSchema[];
  quote_cost_buildup: IQuoteCostBuildupSchema;
}

const DetailedQuoteSchema = new Schema<IDetailedQuoteSchema>(
  {
    system_production: SystemProductionSchema,
    utility_program: UtilityProgramSchema,
    quote_finance_product: QuoteFinanceProductSchema,
    savings_details: [SavingsDetailsSchema],
    quoteCostBuildup: QuoteCostBuildupSchema,
  },
  { _id: false },
);

export interface Quote extends Document {
  opportunity_id: string;
  system_design_id: string;
  quote_model_type: string;
  detailed_quote: IDetailedQuoteSchema;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const QuoteSchema = new Schema<Quote>({
  opportunity_id: String,
  system_design_id: String,
  quote_model_type: String,
  detailed_quote: DetailedQuoteSchema,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

export class QuoteModel {
  opportunity_id: string;
  system_design_id: string;
  quote_model_type: string;
  detailed_quote: IDetailedQuoteSchema;

  constructor(data: CreateQuoteDto) {
    this.opportunity_id = data.opportunityId;
    this.system_design_id = data.systemDesignId;
    this.quote_model_type = 'detailed';
    this.detailed_quote = this.transformDetailedQuote(data);
  }

  transformDetailedQuote(data: CreateQuoteDto): IDetailedQuoteSchema {
    const {
      solarDesign: { adders, inverters, storage, panelArray },
      systemProduction,
      utilityProgram,
      quoteFinanceProduct: { initialDeposit, incentiveDetails, rebateDetails, projectDiscountDetail, finaceProduct },
      calculatedQuoteDetails,
    } = data;
    return {
      system_production: toSnakeCase(systemProduction),
      utility_program: utilityProgram,
      quote_finance_product: {
        incentive_details: incentiveDetails.map(item => toSnakeCase(item)),
        rebate_details: rebateDetails.map(item => toSnakeCase(item)),
        finace_product: toSnakeCase(finaceProduct),
        net_amount: initialDeposit,
        project_discount_details: projectDiscountDetail.map(item => toSnakeCase(item)),
      },
    } as any;
  }
}

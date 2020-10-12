import { Document, Schema } from 'mongoose';
import {
  AdderModelSchema,
  IAdderModel,
  IProductSchema,
  ISystemProductionSchema,
  ProductSchema,
  SystemProductionSchema,
} from 'src/system-designs/system-design.schema';
import { toSnakeCase } from 'src/utils/transformProperties';
import { CreateQuoteDto } from './req/create-quote.dto';
import { UpdateQuoteDto } from './req/update-quote.dto';

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
  rate_per_kWh: number;
}

export interface IMilestonePayment {
  name: string;
  amount: number;
  percentage: number;
}

export interface ICashQuoteConfigSnapshot {
  type: string;
  config: {
    name: string;
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

export interface IFinanceProductSchema {
  product_type: string;
  funding_source_id: string;
  funding_source_name: string;
  product_attribute: ILoanProductAttributes | ILeaseProductAttributes | ICashProductAttributes;
}

const FinanceProductSchema = new Schema<IFinanceProductSchema>(
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
  finance_product: IFinanceProductSchema;
  net_amount: number;
  incentive_details: IIncentiveDetailsSchema[]; ///////////////////////////////////////////////
  rebate_details: IRebateDetailsSchema[];
  project_discount_details: IProjectDiscountDetailSchema[];
}

const QuoteFinanceProductSchema = new Schema<IQuoteFinanceProductSchema>(
  {
    finance_product: FinanceProductSchema,
    incentive_details: [IncentiveDetailsSchema],
    rebate_details: [RebateDetailsSchema],
    net_amount: Number,
    project_discount_details: [ProjectDiscountDetailSchema],
  },
  { _id: false },
);

export interface IUtilityProgramSchema {
  utility_program_id: string;
  utility_program_name: string;
}

const UtilityProgramSchema = new Schema<IUtilityProgramSchema>(
  {
    utility_program_id: String,
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

const SavingsDetailsSchema = new Schema<ISavingsDetailsSchema>(
  {
    year: Number,
    current_utility_bill: Number,
    new_utility_bill: Number,
    payment: Number,
    discount_and_incentives: Number,
    annual_saving: Number,
  },
  { _id: false },
);

export interface IDiscountDetailSchema {
  amount: number;
  description: string;
}

const DiscountDetailSchema = new Schema<IDiscountDetailSchema>(
  {
    amount: Number,
    description: String,
  },
  { _id: false },
);

export interface IQuoteCostCommonSchema {
  cost: number;
  markup: number;
  discount_details: IDiscountDetailSchema[];
  net_cost: number;
}

export interface ILaborCostSchema extends IQuoteCostCommonSchema {
  labor_cost_data_snapshot: { calculation_type: string; unit: string };
  labor_cost_snapshot_date: Date;
}

const LaborCostSchema = new Schema<ILaborCostSchema>(
  {
    labor_cost_data_snapshot: new Schema({ calculation_type: String, unit: String }),
    labor_cost_snapshot_date: Date,
    cost: Number,
    markup: Number,
    discount_details: [DiscountDetailSchema],
    net_cost: Number,
  },
  { _id: false },
);

export interface IPanelQuoteDetailsSchema extends IQuoteCostCommonSchema {
  panel_model_id: string;
  panel_model_data_snapshot: IProductSchema;
  panel_model_snapshot_date: Date;
  quantity: number;
}

const PanelQuoteDetailsSchema = new Schema<IPanelQuoteDetailsSchema>(
  {
    panel_model_id: String,
    panel_model_data_snapshot: ProductSchema,
    panel_model_snapshot_date: Date,
    quantity: Number,
    cost: Number,
    markup: Number,
    discount_details: [DiscountDetailSchema],
    net_cost: Number,
  },
  { _id: false },
);

export interface IInverterQuoteDetailsSchema extends IQuoteCostCommonSchema {
  inverter_model_id: string;
  inverter_model_data_snapshot: IProductSchema;
  inverter_model_snapshot_date: Date;
  quantity: number;
}

const InverterQuoteDetailsSchema = new Schema<IInverterQuoteDetailsSchema>(
  {
    inverter_model_id: String,
    inverter_model_data_snapshot: ProductSchema,
    inverter_model_snapshot_date: Date,
    quantity: Number,
    cost: Number,
    markup: Number,
    discount_details: [DiscountDetailSchema],
    net_cost: Number,
  },
  { _id: false },
);

export interface IStorageQuoteDetailsSchema extends IQuoteCostCommonSchema {
  storage_model_id: string;
  storage_model_data_snapshot: IProductSchema;
  storage_model_snapshot_date: Date;
  quantity: number;
}

const StorageQuoteDetailsSchema = new Schema<IStorageQuoteDetailsSchema>(
  {
    storage_model_id: String,
    storage_model_data_snapshot: ProductSchema,
    storage_model_snapshot_date: Date,
    quantity: Number,
    cost: Number,
    markup: Number,
    discount_details: [DiscountDetailSchema],
    net_cost: Number,
  },
  { _id: false },
);

export interface IAdderQuoteDetailsSchema extends IQuoteCostCommonSchema {
  adder_model_id: string;
  adder_model_data_snapshot: IAdderModel;
  adder_model_snapshot_date: Date;
  quantity: number;
}

const AdderQuoteDetailsSchema = new Schema<IAdderQuoteDetailsSchema>(
  {
    adder_model_id: String,
    adder_model_data_snapshot: AdderModelSchema,
    adder_model_snapshot_date: Date,
    quantity: Number,
    cost: Number,
    markup: Number,
    discount_details: [DiscountDetailSchema],
    net_cost: Number,
  },
  { _id: false },
);

export interface IQuoteCostBuildupSchema {
  panel_quote_details: IPanelQuoteDetailsSchema[];
  inverter_quote_details: IInverterQuoteDetailsSchema[];
  storage_quote_details: IStorageQuoteDetailsSchema[];
  adder_quote_details: IAdderQuoteDetailsSchema[];
  overall_markup: number;
  total_product_cost: number;
  labor_cost: ILaborCostSchema;
  gross_amount: number;
}

const QuoteCostBuildupSchema = new Schema<IQuoteCostBuildupSchema>({
  panel_quote_details: [PanelQuoteDetailsSchema],
  inverter_quote_details: [InverterQuoteDetailsSchema],
  storage_quote_details: [StorageQuoteDetailsSchema],
  adder_quote_details: [AdderQuoteDetailsSchema],
  overall_markup: Number,
  total_product_cost: Number,
  labor_cost: LaborCostSchema,
  gross_amount: Number,
});

export interface IDetailedQuoteSchema {
  system_production: ISystemProductionSchema;
  utility_program: IUtilityProgramSchema;
  quote_finance_product: IQuoteFinanceProductSchema;
  savings_details: ISavingsDetailsSchema[];
  quote_cost_buildup: IQuoteCostBuildupSchema;
  quote_name: string;
  is_selected: boolean;
  is_solar: boolean;
  is_retrofit: boolean;
}

const DetailedQuoteSchema = new Schema<IDetailedQuoteSchema>(
  {
    system_production: SystemProductionSchema,
    utility_program: UtilityProgramSchema,
    quote_finance_product: QuoteFinanceProductSchema,
    savings_details: [SavingsDetailsSchema],
    quote_cost_buildup: QuoteCostBuildupSchema,
    quote_name: String,
    is_selected: Boolean,
    is_solar: Boolean,
    is_retrofit: Boolean,
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

  constructor(data: CreateQuoteDto | UpdateQuoteDto, detailedQuote: any) {
    this.opportunity_id = data.opportunityId;
    this.system_design_id = data.systemDesignId;
    this.quote_model_type = 'detailed';
    this.detailed_quote = this.transformDetailedQuote(detailedQuote);
  }

  transformDetailedQuote(data: any): IDetailedQuoteSchema {
    const {
      systemProduction,
      utilityProgram,
      quoteFinanceProduct: { netAmount, incentiveDetails, rebateDetails, projectDiscountDetails, financeProduct },
      savingsDetails,
      quoteCostBuildup: {
        panelQuoteDetails,
        inverterQuoteDetails,
        storageQuoteDetails,
        adderQuoteDetails,
        overallMarkup,
        totalProductCost,
        laborCost,
        grossAmount,
      },
      quoteName,
      isSelected,
      isSolar,
      isRetrofit,
    } = data;
    return {
      system_production: systemProduction,
      quote_name: quoteName,
      is_selected: isSelected,
      is_solar: isSolar,
      is_retrofit: isRetrofit,
      utility_program: utilityProgram,
      quote_finance_product: {
        incentive_details: incentiveDetails.map(item => toSnakeCase(item)),
        rebate_details: rebateDetails.map(item => toSnakeCase(item)),
        finance_product: toSnakeCase(financeProduct),
        net_amount: netAmount,
        project_discount_details: projectDiscountDetails.map(item => toSnakeCase(item)),
      },
      savings_details: savingsDetails.map(item => toSnakeCase(item)),
      quote_cost_buildup: {
        panel_quote_details: panelQuoteDetails.map(panelQuote => toSnakeCase(panelQuote)),
        inverter_quote_details: inverterQuoteDetails.map(inverterQuote => toSnakeCase(inverterQuote)),
        storage_quote_details: storageQuoteDetails.map(storageQuote => toSnakeCase(storageQuote)),
        adder_quote_details: adderQuoteDetails.map(adderQuote => toSnakeCase(adderQuote)),
        overall_markup: overallMarkup,
        total_product_cost: totalProductCost,
        labor_cost: toSnakeCase(laborCost),
        gross_amount: grossAmount,
      } as IQuoteCostBuildupSchema,
    };
  }
}

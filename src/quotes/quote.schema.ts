import { Document, Schema } from 'mongoose';
import {
  IRoofTopSchema,
  ISystemProductionSchema,
  RoofTopSchema,
  SystemProductionSchema,
} from 'src/system-designs/system-design.schema';
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

export interface ILoanProductAttributes {
  upfront_payment: number;
  loan_amount: number;
  interest_rate: number;
  loan_term: number;
  monthly_loan_payment: number;
  current_monthly_average_utility_payment: number;
  monthly_utility_payment: number;
  grid_service_payment: number;
  net_customer_energy_spend: number;
  return_on_investment: number;
  pay_back_period: number;
}

export interface ILeaseProductAttributes {
  upfront_payment: number;
  lease_amount: number;
  lease_term: number;
  monthly_lease_payment: number;
  current_monthly_average_utility_payment: number;
  monthly_utility_payment: number;
  monthly_energy_payment: number;
  grid_service_payment: number;
  net_customer_energy_spend: number;
  return_on_investment: number;
  pay_back_period: number;
}

export interface ICashProductAttributes {
  upfront_payment: number;
  balance: number;
  //FIXME: need to implement later
  milestone_payment: any;
  current_average_monthly_bill: number;
  new_average_monthly_bill: number;
}

export interface IFinaceProductSchema {
  product_type: string;
  funding_source_id: string;
  funding_source_name: string;
  //FIXME: need to implement later
  product_attribute: ILoanProductAttributes | ILeaseProductAttributes | ICashProductAttributes;
}

const FinaceProductSchema = new Schema<IFinaceProductSchema>(
  {
    product_type: String,
    funding_source_id: String,
    funding_source_name: String,
    //FIXME: need to implement later
    product_attribute: Schema.Types.Mixed,
  },
  { _id: false },
);

export interface IProjectDiscountDetailSchema {
  unit: string;
  unit_value: number;
  applies_to: string;
  description: string;
}

const ProjectDiscountDetailSchema = new Schema<IProjectDiscountDetailSchema>(
  {
    unit: String,
    unit_value: Number,
    applies_to: String,
    description: String,
  },
  { _id: false },
);

export interface IQuoteFinanceProductSchema {
  incentive_details: IIncentiveDetailsSchema[];
  rebate_details: IRebateDetailsSchema[];
  finace_product: IFinaceProductSchema;
  initial_deposit: number;
  project_discount_detail: IProjectDiscountDetailSchema[];
}

const QuoteFinanceProductSchema = new Schema<IQuoteFinanceProductSchema>(
  {
    incentive_details: [IncentiveDetailsSchema],
    rebate_details: [RebateDetailsSchema],
    finace_product: FinaceProductSchema,
    initial_deposit: Number,
    project_discount_detail: [ProjectDiscountDetailSchema],
  },
  { _id: false },
);

export interface ICalculatedQuoteDetailsSchema {
  initial_cost: number;
  cost_per_watt: number;
  monthly_payment: number;
  initial_payment: number;
  solar_rate: number;
}

const CalculatedQuoteDetailsSchema = new Schema<ICalculatedQuoteDetailsSchema>(
  {
    initial_cost: Number,
    cost_per_watt: Number,
    monthly_payment: Number,
    initial_payment: Number,
    solar_rate: Number,
  },
  { _id: false },
);

export interface IDetailedQuoteSchema {
  quote_id?: string;
  solar_design: IRoofTopSchema;
  system_production: ISystemProductionSchema;
  //FIXME: need to implement later
  utility_program: any;
  quote_finance_product: IQuoteFinanceProductSchema;
  calculated_quote_details: ICalculatedQuoteDetailsSchema;
}

const DetailedQuoteSchema = new Schema<IDetailedQuoteSchema>(
  {
    quote_id: String,
    solar_design: RoofTopSchema,
    system_production: SystemProductionSchema,
    //FIXME: need to implement later
    utility_program: Schema.Types.Mixed,
    quote_finance_product: QuoteFinanceProductSchema,
    calculated_quote_details: CalculatedQuoteDetailsSchema,
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
      solar_design: {
        panel_array: panelArray.map(item => toSnakeCase(item)),
        inverters: inverters.map(item => toSnakeCase(item)),
        storage: storage.map(item => toSnakeCase(item)),
        adders: adders.map(item => toSnakeCase(item)),
      },
      system_production: toSnakeCase(systemProduction),
      utility_program: utilityProgram,
      quote_finance_product: {
        incentive_details: incentiveDetails.map(item => toSnakeCase(item)),
        rebate_details: rebateDetails.map(item => toSnakeCase(item)),
        finace_product: toSnakeCase(finaceProduct),
        initial_deposit: initialDeposit,
        project_discount_detail: projectDiscountDetail.map(item => toSnakeCase(item)),
      },
      calculated_quote_details: toSnakeCase(calculatedQuoteDetails),
    };
  }
}

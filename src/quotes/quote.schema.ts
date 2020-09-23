import { Document, Schema } from 'mongoose';
import {
  IRoofTopSchema,
  ISystemProductionSchema,
  RoofTopSchema,
  SystemProductionSchema,
} from 'src/system-designs/system-design.schema';

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

export interface IFinaceProductSchema {
  product_type: string;
  funding_source_id: string;
  funding_source_name: string;
  //FIXME: need to implement later
  product_attribute: string | any;
}

const FinaceProductSchema = new Schema<IFinaceProductSchema>(
  {
    product_type: String,
    funding_source_id: String,
    funding_source_name: String,
    //FIXME: need to implement later
    product_attribute: String,
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
  quote_id: string;
  solar_design: IRoofTopSchema;
  system_production: ISystemProductionSchema;
  //FIXME: need to implement later
  utility_program: any;
  quote_finance_product: IQuoteFinanceProductSchema;
  calculated_quote_details: ICalculatedQuoteDetailsSchema;
}

const DetailedQuoteSchema = new Schema<IDetailedQuoteSchema>({
  quote_id: String,
  solar_design: RoofTopSchema,
  system_production: SystemProductionSchema,
  //FIXME: need to implement later
  utility_program: String,
  quote_finance_product: QuoteFinanceProductSchema,
  calculated_quote_details: CalculatedQuoteDetailsSchema,
});

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

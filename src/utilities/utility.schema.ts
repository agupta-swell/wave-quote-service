import { Document, Schema } from 'mongoose';
import { ITypicalBaseLine } from '../external-services/typing';

export const GENABILITY_TYPICAL_BASE_LINE = Symbol('GENABILITY_TYPICAL_BASE_LINE').toString();

export interface ITypicalUsage {
  i: number;
  v: number;
}

const TypicalUsageSchema = new Schema<ITypicalUsage>(
  {
    i: Number,
    v: Number,
  },
  { _id: false },
);

export interface GenabilityTypicalBaseLine extends Document {
  zip_code: number;
  building_type: string;
  customer_class: string;
  lse_name: string;
  lse_id: number;
  source_type: string;
  annual_consumption: number;
  typical_hourly_usage: ITypicalUsage[];
  typical_monthly_usage: ITypicalUsage[];
}

export const GenabilityTypicalBaseLineSchema = new Schema<GenabilityTypicalBaseLine>({
  zip_code: Number,
  building_type: String,
  customer_class: String,
  lse_name: String,
  lse_id: Number,
  source_type: String,
  annual_consumption: Number,
  typical_hourly_usage: [TypicalUsageSchema],
  typical_monthly_usage: [TypicalUsageSchema],
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

export class GenabilityTypicalBaseLineModel {
  zip_code: number;
  building_type: string;
  customer_class: string;
  lse_name: string;
  lse_id: number;
  source_type: string;
  annual_consumption: number;
  typical_hourly_usage: ITypicalUsage[];
  typical_monthly_usage: ITypicalUsage[];

  constructor(props: ITypicalBaseLine) {
    this.zip_code = props.zipCode;
    this.building_type = props.buildingType;
    this.customer_class = props.customerClass;
    this.lse_name = props.lseName;
    this.lse_id = props.lseId;
    this.source_type = props.sourceType;
    this.annual_consumption = props.annualConsumption;
    this.typical_hourly_usage = props.typicalHourlyUsage;
    this.typical_monthly_usage = props.typicalMonthlyUsage;
  }
}

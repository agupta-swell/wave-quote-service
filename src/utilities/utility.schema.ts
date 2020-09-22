import { Document, Schema } from 'mongoose';
import { ITypicalBaseLine } from '../external-services/typing';
import { toSnakeCase } from '../utils/transformProperties';
import { UpdateUsageDto } from './req/update-usage';

export const GENABILITY_USAGE_DATA = Symbol('GENABILITY_USAGE_DATA').toString();
export const UTILITY_USAGE_DETAILS = Symbol('UTILITY_USAGE_DETAILS').toString();

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

export interface IGenabilityTypicalBaseLine extends Document {
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

const GenabilityTypicalBaseLineSchema = new Schema<IGenabilityTypicalBaseLine>({
  zip_code: Number,
  building_type: String,
  customer_class: String,
  lse_name: String,
  lse_id: Number,
  source_type: String,
  annual_consumption: Number,
  typical_hourly_usage: [TypicalUsageSchema],
  typical_monthly_usage: [TypicalUsageSchema],
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

export interface GenabilityUsageData extends Document {
  zip_code: number;
  lse_id: number;
  typical_baseline: IGenabilityTypicalBaseLine;
  // FIXME: change type later
  baseline_cost: string;
}

export const GenabilityUsageDataSchema = new Schema<GenabilityUsageData>({
  zip_code: Number,
  lse_id: Number,
  typical_baseline: GenabilityTypicalBaseLineSchema,
  // FIXME: change type later
  baseline_cost: String,
});

export interface IAcutalUsage {
  opportunity_id: string;
  source_type: string;
  annual_consumption: number;
  monthly_usage: ITypicalUsage[];
}

export const AcutalUsageSchema = new Schema<IAcutalUsage>(
  {
    opportunity_id: String,
    source_type: String,
    annual_consumption: Number,
    monthly_usage: [TypicalUsageSchema],
  },
  { _id: false },
);

export interface ILoadServingEntityData {
  name: string;
  lse_name: string;
  lse_code: string;
  zip_code: number;
  service_type: string;
  lse_id: string;
}

export const LoadServingEntityDataSchema = new Schema<ILoadServingEntityData>(
  {
    name: String,
    lse_name: String,
    lse_code: String,
    zip_code: Number,
    service_type: String,
    lse_id: String,
  },
  { _id: false },
);

export interface IUtilityData {
  load_serving_entity_data: ILoadServingEntityData;
  typical_baseline_usage: IGenabilityTypicalBaseLine;
  actual_usage: IAcutalUsage;
}

export const UtilityDataSchema = new Schema<IUtilityData>(
  {
    load_serving_entity_data: LoadServingEntityDataSchema,
    typical_baseline_usage: GenabilityTypicalBaseLineSchema,
    actual_usage: AcutalUsageSchema,
  },
  { _id: false },
);

export interface ICostDetailData {
  start_date: Date;
  end_date: Date;
  i: number;
  v: number;
}

export const CostDetailDataSchema = new Schema<ICostDetailData>(
  {
    start_date: Date,
    end_date: Date,
    i: Number,
    v: Number,
  },
  { _id: false },
);

export interface IUtilityCostData {
  start_date: Date;
  end_date: Date;
  interval: string;
  cost: ICostDetailData[];
}

export const UtilityCostDataSchema = new Schema<IUtilityCostData>(
  {
    start_date: Date,
    end_date: Date,
    interval: String,
    cost: [CostDetailDataSchema],
  },
  { _id: false },
);

export interface ICostData {
  master_tariff_id: string;
  typical_usage_cost: IUtilityCostData;
  actual_usage_cost: IUtilityCostData;
}

export const CostDataSchema = new Schema<ICostData>(
  {
    master_tariff_id: String,
    typical_usage_cost: UtilityCostDataSchema,
    actual_usage_cost: UtilityCostDataSchema,
  },
  { _id: false },
);

export interface UtilityUsageDetails extends Document {
  opportunity_id: string;
  utility_data: IUtilityData;
  cost_data: ICostData;
}

export const UtilityUsageDetailsSchema = new Schema<UtilityUsageDetails>({
  opportunity_id: String,
  utility_data: UtilityDataSchema,
  cost_data: CostDataSchema,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

export class UtilityUsageDetailsModel {
  opportunity_id: string;
  utility_data: IUtilityData;
  cost_data: ICostData;

  constructor(props: UpdateUsageDto | any) {
    this.opportunity_id = props.opportunityId;
    this.utility_data = toSnakeCase(props.utilityData);
    this.cost_data = toSnakeCase(props.costData);
  }
}

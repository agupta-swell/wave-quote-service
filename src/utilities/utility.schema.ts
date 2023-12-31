import { Document, Schema } from 'mongoose';
import { IElectricVehicleSnapshot } from 'src/electric-vehicles/interfaces';
import { ElectricVehicleSnapshotSchema } from 'src/electric-vehicles/schemas';
import { IUsageProfile, IUsageProfileSnapshot } from 'src/usage-profiles/interfaces';
import { UsageProfileSnapshotSchema } from 'src/usage-profiles/schema';
import { ITypicalBaseLine } from '../external-services/typing';
import { ENTRY_MODE } from './constants';
import { CreateUtilityReqDto } from './req/create-utility.dto';

export const GENABILITY_USAGE_DATA = Symbol('GENABILITY_USAGE_DATA').toString();
export const UTILITY_USAGE_DETAILS = Symbol('UTILITY_USAGE_DETAILS').toString();
export const GENABILITY_COST_DATA = Symbol('GENABILITY_COST_DATA').toString();

export interface IUsageValue {
  i: number;
  v: number;
}

const UsageValueSchema = new Schema<Document<IUsageValue>>(
  {
    i: Number,
    v: Number,
  },
  { _id: false },
);

export interface IGenabilityTypicalBaseLine extends Document {
  zipCode: number;
  buildingType: string;
  customerClass: string;
  lseName: string;
  lseId: number;
  sourceType: string;
  annualConsumption: number;
  typicalHourlyUsage: IUsageValue[];
  typicalMonthlyUsage: IUsageValue[];
}

export interface IExistingSystemProduction {
  annualProduction: number;
  monthlyProduction: IUsageValue[];
}

const GenabilityTypicalBaseLineSchema = new Schema<IGenabilityTypicalBaseLine>({
  zip_code: Number,
  building_type: String,
  customer_class: String,
  lse_name: String,
  lse_id: Number,
  source_type: String,
  annual_consumption: Number,
  typical_hourly_usage: [UsageValueSchema],
  typical_monthly_usage: [UsageValueSchema],
});

export class GenabilityTypicalBaseLineModel {
  zipCode: number;

  buildingType: string;

  customerClass: string;

  lseName: string;

  lseId: number;

  sourceType: string;

  annualConsumption: number;

  typicalHourlyUsage: IUsageValue[];

  typicalMonthlyUsage: IUsageValue[];

  constructor(props: ITypicalBaseLine) {
    this.zipCode = props.zipCode;
    this.buildingType = props.buildingType;
    this.customerClass = props.customerClass;
    this.lseName = props.lseName;
    this.lseId = props.lseId;
    this.sourceType = props.sourceType;
    this.annualConsumption = props.annualConsumption;
    this.typicalHourlyUsage = props.typicalHourlyUsage;
    this.typicalMonthlyUsage = props.typicalMonthlyUsage;
  }
}

export interface GenabilityUsageData extends Document {
  zipCode: number;
  lseId: number;
  typicalBaseline: IGenabilityTypicalBaseLine;
  // FIXME: change type later
  baselineCost: string;
}

export const GenabilityUsageDataSchema = new Schema<GenabilityUsageData>({
  zip_code: Number,
  lse_id: Number,
  typical_baseline: GenabilityTypicalBaseLineSchema,
  // FIXME: change type later
  baseline_cost: String,
});

GenabilityUsageDataSchema.post('save', function (_, next) {
  if (this.__v === 0) {
    // mark document __v as 1 to indicate the result from GenabilityAPI without sizingValue
    this.__v = 1;
    this.save().then(() => next());
  } else next();
});

export interface IActualUsage {
  opportunityId: string;
  sourceType: string;
  annualConsumption: number;
  monthlyUsage: IUsageValue[];
  hourlyUsage: IUsageValue[];
}

export const ActualUsageSchema = new Schema<Document<IActualUsage>>(
  {
    opportunity_id: String,
    source_type: String,
    annual_consumption: Number,
    monthly_usage: [UsageValueSchema],
    hourly_usage: [UsageValueSchema],
  },
  { _id: false },
);

export interface IComputedUsage {
  annualConsumption: number;
  monthlyUsage: IUsageValue[];
  hourlyUsage: IUsageValue[];
}

export const ComputedUsageSchema = new Schema<Document<IComputedUsage>>(
  {
    annual_consumption: Number,
    monthly_usage: [UsageValueSchema],
    hourly_usage: [UsageValueSchema],
  },
  { _id: false },
);

export interface ILoadServingEntityData {
  name: string;
  lseName: string;
  lseCode: string;
  zipCode: number;
  serviceType: string;
  lseId: string;
}

export const LoadServingEntityDataSchema = new Schema<Document<ILoadServingEntityData>>(
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

export interface IUsageProfileProduction {
  annualUsage: number;
  monthlyUsage: number[];
  hourlyUsage?: number[];
}

export interface IUtilityData {
  loadServingEntityData: ILoadServingEntityData;
  typicalBaselineUsage: IGenabilityTypicalBaseLine;
  actualUsage: IActualUsage;
  computedUsage: IComputedUsage;
  computedAdditions: IUsageProfileProduction;
  homeUsageProfile: IUsageProfileProduction;
  adjustedUsageProfile: IUsageProfileProduction;
  currentUsageProfile: IUsageProfileProduction;
  plannedProfile: IUsageProfileProduction;
}

export const UsageProfileProductionSchema = new Schema<Document<IUsageProfileProduction>>(
  {
    annual_usage: Number,
    monthly_usage: [Number],
  },
  { _id: false },
);

export const UtilityDataSchema = new Schema<Document<IUtilityData>>(
  {
    load_serving_entity_data: LoadServingEntityDataSchema,
    typical_baseline_usage: GenabilityTypicalBaseLineSchema,
    actual_usage: ActualUsageSchema,
    computed_usage: ComputedUsageSchema,
    computed_additions: UsageProfileProductionSchema,
    home_usage_profile: UsageProfileProductionSchema,
    adjusted_usage_profile: UsageProfileProductionSchema,
    current_usage_profile: UsageProfileProductionSchema,
    planned_profile: UsageProfileProductionSchema,
  },
  { _id: false },
);

export interface ICostDetailData {
  startDate: Date;
  endDate: Date;
  i: number;
  v: number;
}

export const CostDetailDataSchema = new Schema<Document<ICostDetailData>>(
  {
    start_date: Date,
    end_date: Date,
    i: Number,
    v: Number,
  },
  { _id: false },
);

export interface IUtilityCostData {
  startDate: Date;
  endDate: Date;
  interval: string;
  cost?: ICostDetailData[];
  annualCost: number;
}

export const UtilityCostDataSchema = new Schema<Document<IUtilityCostData>>(
  {
    start_date: Date,
    end_date: Date,
    interval: String,
    cost: [CostDetailDataSchema],
    annual_cost: Number,
  },
  { _id: false },
);

export interface ICostData {
  masterTariffId: string;
  typicalUsageCost: IUtilityCostData;
  actualUsageCost: IUtilityCostData;
  computedCost: IUtilityCostData;
  postInstallMasterTariffId: string;
  currentUsageCost: IUtilityCostData;
  plannedCost: IUtilityCostData;
}

export const CostDataSchema = new Schema<Document<ICostData>>(
  {
    master_tariff_id: String,
    typical_usage_cost: UtilityCostDataSchema,
    actual_usage_cost: UtilityCostDataSchema,
    computed_cost: UtilityCostDataSchema,
    post_install_master_tariff_id: String,
    current_usage_cost: UtilityCostDataSchema,
    planned_cost: UtilityCostDataSchema,
  },
  { _id: false },
);

export interface IUtilityUsageDetails extends Partial<IUsageProfileSnapshot> {
  opportunityId: string;
  utilityData: IUtilityData;
  costData: ICostData;
  poolValue: number;
  entryMode: ENTRY_MODE;
  increaseAmount: number;
  electricVehicles: IElectricVehicleSnapshot[];
  totalPlannedUsageIncreases: number;
  hasMedicalBaseline?: boolean;
  medicalBaselineAmount?: number;
  isLowIncomeOrDac?: boolean;
}

export type UtilityUsageDetails = Document & IUtilityUsageDetails;

export const UtilityUsageDetailsSchema = new Schema<UtilityUsageDetails>({
  opportunity_id: String,
  entry_mode: String,
  pool_value: Number,
  utility_data: UtilityDataSchema,
  cost_data: CostDataSchema,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
  ...UsageProfileSnapshotSchema.obj,
  increase_amount: Number,
  electric_vehicles: [ElectricVehicleSnapshotSchema],
  total_planned_usage_increases: Number,
  has_medical_baseline: Boolean,
  medical_baseline_amount: Number,
  is_low_income_or_dac: Boolean,
});

export interface GenabilityCostData extends Document {
  zipCode: number;
  masterTariffId: string;
  utilityCost: IUtilityCostData;
}

export const GenabilityCostDataSchema = new Schema<GenabilityCostData>({
  zip_code: Number,
  master_tariff_id: String,
  utility_cost: UtilityCostDataSchema,
});

export class UtilityUsageDetailsModel {
  opportunityId: string;

  utilityData: IUtilityData;

  costData: ICostData;

  entryMode: ENTRY_MODE;

  usageProfileId?: string;

  usageProfileSnapshotDate?: Date;

  usageProfileSnapshot?: IUsageProfile;

  increaseAmount: number;

  electricVehicles: IElectricVehicleSnapshot[];

  poolValue: number;

  totalPlannedUsageIncreases: number;

  hasMedicalBaseline: boolean;

  medicalBaselineAmount: number | undefined;

  isLowIncomeOrDac?: boolean;

  constructor(props: CreateUtilityReqDto | any) {
    this.opportunityId = props.opportunityId;
    this.utilityData = props.utilityData;
    this.costData = props.costData;
    this.entryMode = props.entryMode;
    this.usageProfileId = props.usageProfileId;
    this.usageProfileSnapshotDate = props.usageProfileSnapshotDate;
    this.usageProfileSnapshot = props.usageProfileSnapshot;
    this.increaseAmount = props.increaseAmount;
    this.poolValue = props.poolValue;
    this.hasMedicalBaseline = props.hasMedicalBaseline;
    this.medicalBaselineAmount = props.medicalBaselineAmount;
    this.electricVehicles = props.electricVehicles ?? [];
    this.isLowIncomeOrDac = props.isLowIncomeOrDac;
  }

  setActualHourlyUsage(data: IUsageValue[]) {
    this.utilityData.actualUsage.hourlyUsage = data;
  }

  setTotalPlannedUsageIncreases(data: number) {
    this.totalPlannedUsageIncreases = data;
  }

  setComputedAdditions(data: IUsageProfileProduction) {
    this.utilityData.computedAdditions = data;
  }

  setHomeUsageProfile(data: IUsageProfileProduction) {
    this.utilityData.homeUsageProfile = data;
  }

  setAdjustedUsageProfile(data: IUsageProfileProduction) {
    this.utilityData.adjustedUsageProfile = data;
  }

  setCurrentUsageProfile(data: IUsageProfileProduction) {
    this.utilityData.currentUsageProfile = data;
  }

  setPlannedProfile(data: IUsageProfileProduction) {
    this.utilityData.plannedProfile = data;
  }

  setCostData(data: ICostData) {
    this.costData = data;
  }
}

export interface IMonthSeasonTariff {
  seasonName: string;
  hourlyTariffRate: number[];
}

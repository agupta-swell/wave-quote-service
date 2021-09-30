import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'mongoose-schema-mapper';
import { FinancialProduct, FinancialProductSchema } from 'src/financial-products/financial-product.schema';
import { GsProgramsSchema } from 'src/gs-programs/gs-programs.schema';
import { LeaseSolverConfig } from 'src/lease-solver-configs/lease-solver-config.schema';
import { COST_UNIT_TYPE } from 'src/system-designs/constants';
import {
  AdderModelSchema,
  AncillaryEquipment,
  BalanceOfSystemProductSchema,
  IAdderModel,
  IAncillaryEquipment,
  IBalanceOfSystemProductSchema,
  IInverterProductSchema,
  InverterProductSchema,
  IPanelProductSchema,
  IStorageProductSchema,
  ISystemProductionSchema,
  PanelProductSchema,
  StorageProductSchema,
  SystemProductionSchema,
} from 'src/system-designs/system-design.schema';
import { ELaborCostType, QUOTE_MODE_TYPE, REBATE_TYPE } from './constants';
import { CreateQuoteDto } from './req/create-quote.dto';
import { UpdateQuoteDto } from './req/update-quote.dto';

export const QUOTE = Symbol('QUOTE').toString();

export interface IGsProgramSnapshot {
  id: string;
  annualIncentives: number;
  termYears: string;
  numberBatteries: string;
  upfrontIncentives: number;
}

export interface IGridServiceDetails {
  gsTermYears: string;
  gsProgramSnapshot: IGsProgramSnapshot;
}

const GridServiceDetailsSchema = new Schema<Document<IGridServiceDetails>>(
  {
    gsTermYears: String,
    gsProgramSnapshot: GsProgramsSchema,
  },
  { _id: false },
);

MongooseNamingStrategy.ExcludeOne(GridServiceDetailsSchema);

export interface IIncentiveDetailsSchema {
  type: REBATE_TYPE;
  detail: IGridServiceDetails;
  amount: number;
}

const IncentiveDetailsSchema = new Schema<Document<IIncentiveDetailsSchema>>(
  {
    type: String,
    amount: Number,
    detail: GridServiceDetailsSchema,
  },
  { _id: false },
);

MongooseNamingStrategy.ExcludeOne(IncentiveDetailsSchema);
export interface IRebateDetailsSchema {
  amount: number;
  type: string;
  description: string;
  isFloatRebate?: boolean;
}

const RebateDetailsSchema = new Schema<Document<IRebateDetailsSchema>>(
  {
    amount: Number,
    type: String,
    description: String,
    is_float_rebate: Boolean,
  },
  { _id: false },
);

export interface IMonthlyLoanPaymentDetails {
  paymentDueDate: Date;
  period: number;
  paymentNumber: number;
  daysInPeriod: number;
  daysInYear: number;
  startingBalance: number;
  monthlyPayment: number;
  interestComponent: number;
  principleComponent: number;
  endingBalance: number;
  adjustedMonthlyPayment: number;
  prePayment: number;
  unpaidInterestForCurrentMonth: number;
  unpaidInterestCumulative: number;
}

export interface IYearlyLoanPaymentDetails {
  year: number;
  monthlyPaymentDetails: IMonthlyLoanPaymentDetails[];
}

export interface IReinvestment {
  reinvestmentAmount: number;
  reinvestmentMonth: number;
  description: string;
}

export interface ILoanProductAttributes {
  upfrontPayment: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  reinvestment: IReinvestment[];
  loanStartDate: Date;
  taxCreditPrepaymentAmount: number;
  willingToPayThroughAch: boolean;
  monthlyLoanPayment: number;
  currentMonthlyAverageUtilityPayment: number;
  monthlyUtilityPayment: number;
  gridServicePayment: number;
  netCustomerEnergySpend: number;
  returnOnInvestment: number;
  payBackPeriod: number;
  currentPricePerKWh: number;
  newPricePerKWh: number;
  yearlyLoanPaymentDetails: IYearlyLoanPaymentDetails[];
}

export interface IMonthlyLeasePaymentDetails {
  month: number;
  paymentAmount: number;
  pv: number;
  es: number;
}

export interface IYearlyLeasePaymentDetails {
  year: number;
  monthlyPaymentDetails: IMonthlyLeasePaymentDetails[];
}

export interface ILeaseProductAttributes {
  upfrontPayment: number;
  leaseAmount: number;
  rateEscalator: number;
  leaseTerm: number;
  monthlyLeasePayment: number;
  currentMonthlyAverageUtilityPayment: number;
  monthlyUtilityPayment: number;
  monthlyEnergyPayment: number;
  gridServicePayment: number;
  netCustomerEnergySpend: number;
  currentPricePerKWh: number;
  newPricePerKWh: number;
  yearlyLeasePaymentDetails: IYearlyLeasePaymentDetails[];
  ratePerKWh: number;
  leaseSolverConfigSnapshot?: LeaseSolverConfig
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
  upfrontPayment: number;
  balance: number;
  milestonePayment: IMilestonePayment[];
  cashQuoteConfigSnapshot: ICashQuoteConfigSnapshot;
  cashQuoteConfigSnapshotDate: Date;
  currentAverageMonthlyBill: number;
  newAverageMonthlyBill: number;
  currentPricePerKWh: number;
  newPricePerKWh: number;
}

export interface IFinanceProductSchema {
  productType: string;
  fundingSourceId: string;
  fundingSourceName: string;
  productAttribute: ILoanProductAttributes | ILeaseProductAttributes | ICashProductAttributes;
  financialProductSnapshot: FinancialProduct;
}

const FinanceProductSchema = new Schema<Document<IFinanceProductSchema>>(
  {
    product_type: String,
    funding_source_id: String,
    funding_source_name: String,
    product_attribute: Schema.Types.Mixed,
    financial_product_snapshot: FinancialProductSchema,
  },
  { _id: false },
);

export interface IProjectDiscountDetailSchema {
  id: string;
  discountId: string;
  name: string;
  amount: number;
  type: string;
  startDate: Date;
  endDate: Date;
}

const ProjectDiscountDetailSchema = new Schema<Document<IProjectDiscountDetailSchema>>(
  {
    discount_id: String,
    name: String,
    amount: Number,
    type: String,
    start_date: Date,
    end_date: Date,
  },
  {
    _id: false,
  },
);

export interface IFinancialProductDetails {
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
}

export interface IQuoteFinanceProductSchema {
  financeProduct: IFinanceProductSchema;
  netAmount: number;
  incentiveDetails: IIncentiveDetailsSchema[];
  rebateDetails: IRebateDetailsSchema[];
  projectDiscountDetails: IProjectDiscountDetailSchema[];
  financialProductSnapshot: IFinancialProductDetails;
}

const QuoteFinanceProductSchema = new Schema<Document<IQuoteFinanceProductSchema>>(
  {
    finance_product: FinanceProductSchema,
    incentive_details: [IncentiveDetailsSchema],
    rebate_details: [RebateDetailsSchema],
    net_amount: Number,
    project_discount_details: [ProjectDiscountDetailSchema],
  },
  { _id: false },
);

export interface IUtilityProgramDataSnapshot {
  name: string;
  rebateAmount: number;
}

const UtilityProgramDataSnapshot = new Schema<Document<IUtilityProgramDataSnapshot>>(
  {
    name: String,
    rebate_amount: Number,
  },
  { _id: false },
);

export interface IUtilityProgramSchema {
  utilityProgramId: string;
  utilityProgramName: string;
  rebateAmount: number;
  utilityProgramDataSnapshot: IUtilityProgramDataSnapshot;
  utilityProgramDataSnapshotDate: Date;
}

const UtilityProgramSchema = new Schema<Document<IUtilityProgramSchema>>(
  {
    utility_program_id: String,
    utility_program_name: String,
    rebate_amount: Number,
    utility_program_data_snapshot: UtilityProgramDataSnapshot,
    utility_program_data_snapshot_date: Date,
  },
  { _id: false },
);

export interface ISavingsDetailsSchema {
  year: number;
  currentUtilityBill: number;
  newUtilityBill: number;
  payment: number;
  discountAndIncentives: number;
  annualSaving: number;
}

const SavingsDetailsSchema = new Schema<Document<ISavingsDetailsSchema>>(
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

export interface IQuoteCostCommonSchema {
  cost: number;
  netCost: number;
  subcontractorMarkup: number;
}

interface IQuotePartnerConfig {
  id: string;
  solarOnlyLaborFeePerWatt: number;
  storageRetrofitLaborFeePerProject: number;
  solarWithACStorageLaborFeePerProject: number;
  solarWithDCStorageLaborFeePerProject: number;
}

const QuotePartnerConfig = new Schema<Document<IQuotePartnerConfig>>(
  {
    id: String,
    solar_only_labor_fee_per_watt: Number,
    storage_retrofit_labor_fee_per_project: Number,
    solar_with_a_c_storage_labor_fee_per_project: Number,
    solar_with_d_c_storage_labor_fee_per_project: Number,
  },
  { _id: false },
);

export interface ILaborCostSchema extends IQuoteCostCommonSchema {
  laborCostDataSnapshot: IQuotePartnerConfig;
  laborCostSnapshotDate: Date;
  laborCostType: ELaborCostType;
}

const LaborCostSchema = new Schema<Document<ILaborCostSchema>>(
  {
    labor_cost_data_snapshot: QuotePartnerConfig,
    labor_cost_snapshot_date: Date,
    cost: Number,
    labor_cost_type: String,
  },
  { _id: false },
);

export interface IPanelQuoteDetailsSchema extends IQuoteCostCommonSchema {
  panelModelId: string;
  panelModelDataSnapshot: IPanelProductSchema;
  panelModelSnapshotDate: Date;
  quantity: number;
}

const PanelQuoteDetailsSchema = new Schema<Document<IPanelQuoteDetailsSchema>>(
  {
    panel_model_id: String,
    panel_model_data_snapshot: PanelProductSchema,
    panel_model_snapshot_date: Date,
    quantity: Number,
    cost: Number,
    net_cost: Number,
    subcontractor_markup: Number,
  },
  { _id: false },
);

export interface IInverterQuoteDetailsSchema extends IQuoteCostCommonSchema {
  inverterModelId: string;
  inverterModelDataSnapshot: IInverterProductSchema;
  inverterModelSnapshotDate: Date;
  quantity: number;
}

const InverterQuoteDetailsSchema = new Schema<Document<IInverterQuoteDetailsSchema>>(
  {
    inverter_model_id: String,
    inverter_model_data_snapshot: InverterProductSchema,
    inverter_model_snapshot_date: Date,
    quantity: Number,
    cost: Number,
    net_cost: Number,
    subcontractor_markup: Number,
  },
  { _id: false },
);

export interface IStorageQuoteDetailsSchema extends IQuoteCostCommonSchema {
  storageModelId: string;
  storageModelDataSnapshot: IStorageProductSchema;
  storageModelSnapshotDate: Date;
  quantity: number;
}

const StorageQuoteDetailsSchema = new Schema<Document<IStorageQuoteDetailsSchema>>(
  {
    storage_model_id: String,
    storage_model_data_snapshot: StorageProductSchema,
    storage_model_snapshot_date: Date,
    quantity: Number,
    cost: Number,
    net_cost: Number,
    subcontractor_markup: Number,
  },
  { _id: false },
);

export interface IAdderQuoteDetailsSchema extends IQuoteCostCommonSchema {
  adderModelId: string;
  adderModelDataSnapshot: IAdderModel;
  adderModelSnapshotDate: Date;
  quantity: number;
  unit: COST_UNIT_TYPE;
}

const AdderQuoteDetailsSchema = new Schema<Document<IAdderQuoteDetailsSchema>>(
  {
    adder_model_id: String,
    adder_model_data_snapshot: AdderModelSchema,
    adder_model_snapshot_date: Date,
    quantity: Number,
    cost: Number,
    net_cost: Number,
    subcontractor_markup: Number,
    unit: String,
  },
  { _id: false },
);

export interface IBalanceOfSystemDetailsSchema extends IQuoteCostCommonSchema {
  balanceOfSystemModelId: string;
  balanceOfSystemModelDataSnapshot: IBalanceOfSystemProductSchema;
  balanceOfSystemModelDataSnapshotDate: Date;
  unit: COST_UNIT_TYPE;
}

const BalanceOfSystemDetailsSchema = new Schema<Document<IBalanceOfSystemDetailsSchema>>(
  {
    balance_of_system_model_id: String,
    balance_of_system_model_data_snapshot: BalanceOfSystemProductSchema,
    balance_of_system_model_data_snapshot_date: Date,
    unit: String,
    cost: Number,
    net_cost: Number,
    subcontractor_markup: Number,
  },
  { _id: false },
);

export interface IAncillaryEquipmentSchema extends IQuoteCostCommonSchema {
  ancillaryEquipmentId: string;
  ancillaryEquipmentModelDataSnapshot: IAncillaryEquipment;
  ancillaryEquipmentModelDataSnapshotDate: Date;
  quantity: number;
}

const AncillaryEquipmentSchema = new Schema<Document<IAncillaryEquipmentSchema>>(
  {
    ancillary_equipment_id: String,
    ancillary_equipment_model_data_snapshot: AncillaryEquipment,
    ancillary_equipment_model_data_snapshot_date: Date,
    quantity: Number,
    cost: Number,
    net_cost: Number,
    subcontractor_markup: Number,
  },
  { _id: false },
);

export interface IQuoteCostBuildupSchema {
  panelQuoteDetails: IPanelQuoteDetailsSchema[];
  inverterQuoteDetails: IInverterQuoteDetailsSchema[];
  storageQuoteDetails: IStorageQuoteDetailsSchema[];
  adderQuoteDetails: IAdderQuoteDetailsSchema[];
  balanceOfSystemDetails: IBalanceOfSystemDetailsSchema[];
  ancillaryEquipmentDetails: IAncillaryEquipmentSchema[];
  swellStandardMarkup: number;
  laborCost: ILaborCostSchema;
  grossPrice: number;
  totalNetCost: number;
}

const QuoteCostBuildupSchema = new Schema<Document<IQuoteCostBuildupSchema>>({
  panel_quote_details: [PanelQuoteDetailsSchema],
  inverter_quote_details: [InverterQuoteDetailsSchema],
  storage_quote_details: [StorageQuoteDetailsSchema],
  adder_quote_details: [AdderQuoteDetailsSchema],
  balance_of_system_details: [BalanceOfSystemDetailsSchema],
  ancillary_equipment_details: [AncillaryEquipmentSchema],
  swell_standard_markup: Number,
  labor_cost: LaborCostSchema,
  gross_price: Number,
  total_net_cost: Number,
});

export interface ITaxCreditConfigDataSnapshotSchema {
  name: string;
  taxCreditPercentage: number;
  taxCreditStartDate: Date;
  taxCreditEndDate: Date;
}

const TaxCreditConfigDataSnapshotSchema = new Schema<Document<ITaxCreditConfigDataSnapshotSchema>>(
  {
    name: String,
    tax_credit_percentage: Number,
    tax_credit_start_date: Date,
    tax_credit_end_date: Date,
  },
  { _id: false },
);

export interface ITaxCreditDataSchema {
  name: string;
  percentage: number;
  taxCreditConfigDataId: string;
  taxCreditConfigDataSnapshot: ITaxCreditConfigDataSnapshotSchema;
  taxCreditConfigDataSnapshotDate: Date;
}

const TaxCreditDataSchema = new Schema<Document<ITaxCreditDataSchema>>(
  {
    name: String,
    percentage: Number,
    tax_credit_config_data_id: String,
    tax_credit_config_data_snapshot: TaxCreditConfigDataSnapshotSchema,
    tax_credit_config_data_snapshot_date: Date,
  },
  { _id: false },
);

export interface IQuotePricePerWattSchema {
  pricePerWatt: number;
  grossPrice: number;
}

const QuotePricePerWattSchema = new Schema<Document<IQuotePricePerWattSchema>>(
  {
    price_per_watt: Number,
    gross_price: Number,
  },
  { _id: false },
);

export interface IQuotePriceOverride {
  grossPrice: number;
}

const QuotePriceOverride = new Schema<Document<IQuotePriceOverride>>(
  {
    gross_price: Number,
  },
  { _id: false },
);

export interface INote {
  id: string;
  text: string;
  showOnProposal: boolean;
  showOnContract: boolean;
  isApproved: boolean;
  approvalComment: string;
  approvedBy: string;
  approvedAt: Date | null;
}

export interface IDetailedQuoteSchema {
  systemProduction: ISystemProductionSchema;
  utilityProgram: IUtilityProgramSchema;
  quoteFinanceProduct: IQuoteFinanceProductSchema;
  savingsDetails: ISavingsDetailsSchema[];
  quoteCostBuildup: IQuoteCostBuildupSchema;
  quoteName: string;
  isSelected: boolean;
  isSolar: boolean;
  isRetrofit: boolean;
  taxCreditData: ITaxCreditDataSchema[];
  utilityProgramSelectedForReinvestment: boolean;
  taxCreditSelectedForReinvestment: boolean;
  allowedQuoteModes: QUOTE_MODE_TYPE[];
  selectedQuoteMode: QUOTE_MODE_TYPE;
  quotePricePerWatt: IQuotePricePerWattSchema;
  quotePriceOverride: IQuotePriceOverride;
  notes: INote[];
}

export const NoteSchema = new Schema<Document<INote>>(
  {
    id: String,
    text: String,
    show_on_proposal: Boolean,
    show_on_contract: Boolean,
    is_approved: Boolean,
    approval_comment: String,
    approved_by: String,
    approved_at: Date,
  },
  { _id: false },
);

export const DetailedQuoteSchema = new Schema<Document<IDetailedQuoteSchema>>(
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
    tax_credit_data: [TaxCreditDataSchema],
    utility_program_selected_for_reinvestment: Boolean,
    tax_credit_selected_for_reinvestment: Boolean,
    allowed_quote_modes: [String],
    selected_quote_mode: String,
    quote_price_per_watt: QuotePricePerWattSchema,
    quote_price_override: QuotePriceOverride,
    notes: [NoteSchema],
  },
  { _id: false },
);

export interface Quote extends Document {
  opportunityId: string;
  systemDesignId: string;
  quoteModelType: string;
  detailedQuote: IDetailedQuoteSchema;
  isSync: boolean;
  isSyncMessages: string[];
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export const QuoteSchema = new Schema<Quote>({
  opportunity_id: String,
  system_design_id: String,
  quote_model_type: String,
  detailed_quote: DetailedQuoteSchema,
  is_sync: Boolean,
  is_sync_messages: [String],
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

export class QuoteModel {
  opportunityId: string;

  systemDesignId: string;

  quoteModelType: string;

  detailedQuote: IDetailedQuoteSchema;

  isSync: boolean;

  isSyncMessages: string[];

  constructor(data: CreateQuoteDto | UpdateQuoteDto, detailedQuote: any) {
    this.opportunityId = data.opportunityId;
    this.systemDesignId = data.systemDesignId;
    this.quoteModelType = 'detailed';
    this.detailedQuote = this.transformDetailedQuote(detailedQuote);
  }

  transformDetailedQuote(data: any): IDetailedQuoteSchema {
    const {
      systemProduction,
      utilityProgram,
      quoteFinanceProduct: {
        netAmount,
        incentiveDetails,
        rebateDetails,
        projectDiscountDetails,
        financeProduct,
        financialProductSnapshot,
      },
      savingsDetails,
      quoteCostBuildup,
      quoteName,
      isSelected,
      isSolar,
      isRetrofit,
      taxCreditData,
      utilityProgramSelectedForReinvestment,
      taxCreditSelectedForReinvestment,
      allowedQuoteModes,
      selectedQuoteMode,
      quotePricePerWatt,
      quotePriceOverride,
      notes,
    } = data;
    return {
      systemProduction,
      quoteName,
      isSelected,
      isSolar,
      isRetrofit,
      utilityProgram,
      quoteFinanceProduct: {
        incentiveDetails: incentiveDetails.map(e => ({
          ...e,
          '@@keep': true,
        })),
        rebateDetails,
        financeProduct,
        netAmount,
        projectDiscountDetails: projectDiscountDetails.map(item => {
          item.discountId = item.id;
          return item;
        }),
        financialProductSnapshot,
      },
      savingsDetails,
      quoteCostBuildup,
      taxCreditSelectedForReinvestment,
      utilityProgramSelectedForReinvestment,
      taxCreditData: (taxCreditData || []).map(item => ({
        taxCreditConfigDataId: item._id,
        name: item.name,
        percentage: item.percentage,
        taxCreditConfigDataSnapshot: {
          name: item.name,
          percentage: item.percentage,
          startDate: item.startDate,
          endDate: item.endDate,
        },
        taxCreditConfigDataSnapshotDate: new Date(),
      })),
      allowedQuoteModes,
      selectedQuoteMode,
      quotePricePerWatt,
      quotePriceOverride,
      notes,
    };
  }

  setIsSync(isSync: boolean): void {
    this.isSync = isSync;
    if (this.isSync) {
      this.isSyncMessages = [];
    }
  }
}

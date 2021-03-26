import { Document, Schema } from 'mongoose';
import { GsPrograms, GsProgramsSchema } from 'src/gs-programs/gs-programs.schema';
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
import { toSnakeCase } from 'src/utils/transformProperties';
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

export interface ISgipDetails {
  gsTermYears: string;
  gsProgramSnapshot: IGsProgramSnapshot;
}

const SgipDetailsSchema = new Schema<Document<ISgipDetails>>(
  {
    gsTermYears: String,
    gsProgramSnapshot: GsProgramsSchema,
  },
  { _id: false },
);

export interface IIncentiveDetailsSchema {
  type: REBATE_TYPE;
  detail: ISgipDetails;
  amount: number;
}

const IncentiveDetailsSchema = new Schema<Document<IIncentiveDetailsSchema>>(
  {
    type: String,
    amount: Number,
    detail: SgipDetailsSchema,
  },
  { _id: false },
);

export interface IRebateDetailsSchema {
  amount: number;
  type: string;
  description: string;
}

const RebateDetailsSchema = new Schema<Document<IRebateDetailsSchema>>(
  {
    amount: Number,
    type: String,
    description: String,
  },
  { _id: false },
);

export interface IMonthlyLoanPaymentDetails {
  payment_due_date: Date;
  period: number;
  payment_number: number;
  days_in_period: number;
  days_in_year: number;
  starting_balance: number;
  monthly_payment: number;
  interest_component: number;
  principle_component: number;
  ending_balance: number;
  adjusted_monthly_payment: number;
  pre_payment: number;
  unpaid_interest_for_current_month: number;
  unpaid_interest_cumulative: number;
}

export interface IYearlyLoanPaymentDetails {
  year: number;
  monthly_payment_details: IMonthlyLoanPaymentDetails[];
}

export interface IReinvestment {
  reinvestment_amount: number;
  reinvestment_month: number;
  description: string;
}

export interface ILoanProductAttributes {
  upfront_payment: number;
  loan_amount: number;
  interest_rate: number;
  loan_term: number;
  reinvestment: IReinvestment[];
  loan_start_date: Date;
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

const FinanceProductSchema = new Schema<Document<IFinanceProductSchema>>(
  {
    product_type: String,
    funding_source_id: String,
    funding_source_name: String,
    product_attribute: Schema.Types.Mixed,
  },
  { _id: false },
);

export interface IProjectDiscountDetailSchema {
  id: string;
  discount_id: string;
  name: string;
  amount: number;
  type: string;
  start_date: Date;
  end_date: Date;
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

export interface IQuoteFinanceProductSchema {
  finance_product: IFinanceProductSchema;
  net_amount: number;
  incentive_details: IIncentiveDetailsSchema;
  rebate_details: IRebateDetailsSchema[];
  project_discount_details: IProjectDiscountDetailSchema[];
}

const QuoteFinanceProductSchema = new Schema<Document<IQuoteFinanceProductSchema>>(
  {
    finance_product: FinanceProductSchema,
    incentive_details: IncentiveDetailsSchema,
    rebate_details: [RebateDetailsSchema],
    net_amount: Number,
    project_discount_details: [ProjectDiscountDetailSchema],
  },
  { _id: false },
);

export interface IUtilityProgramDataSnapshot {
  name: string;
  rebate_amount: number;
}

const UtilityProgramDataSnapshot = new Schema<Document<IUtilityProgramDataSnapshot>>(
  {
    name: String,
    rebate_amount: Number,
  },
  { _id: false },
);

export interface IUtilityProgramSchema {
  utility_program_id: string;
  utility_program_name: string;
  rebate_amount: number;
  utility_program_data_snapshot: IUtilityProgramDataSnapshot;
  utility_program_data_snapshot_date: Date;
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
  current_utility_bill: number;
  new_utility_bill: number;
  payment: number;
  discount_and_incentives: number;
  annual_saving: number;
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
  net_cost: number;
  subcontractor_markup: number;
}

interface IQuotePartnerConfig {
  id: string;
  solar_only_labor_fee_per_watt: number;
  storage_retrofit_labor_fee_per_project: number;
  solar_with_a_c_storage_labor_fee_per_project: number;
  solar_with_d_c_storage_labor_fee_per_project: number;
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
  labor_cost_data_snapshot: IQuotePartnerConfig;
  labor_cost_snapshot_date: Date;
  labor_cost_type: ELaborCostType;
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
  panel_model_id: string;
  panel_model_data_snapshot: IPanelProductSchema;
  panel_model_snapshot_date: Date;
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
  inverter_model_id: string;
  inverter_model_data_snapshot: IInverterProductSchema;
  inverter_model_snapshot_date: Date;
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
  storage_model_id: string;
  storage_model_data_snapshot: IStorageProductSchema;
  storage_model_snapshot_date: Date;
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
  adder_model_id: string;
  adder_model_data_snapshot: IAdderModel;
  adder_model_snapshot_date: Date;
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
  balance_of_system_model_id: string;
  balance_of_system_model_data_snapshot: IBalanceOfSystemProductSchema;
  balance_of_system_model_data_snapshot_date: Date;
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
  ancillary_equipment_id: string;
  ancillary_equipment_model_data_snapshot: IAncillaryEquipment;
  ancillary_equipment_model_data_snapshot_date: Date;
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
  panel_quote_details: IPanelQuoteDetailsSchema[];
  inverter_quote_details: IInverterQuoteDetailsSchema[];
  storage_quote_details: IStorageQuoteDetailsSchema[];
  adder_quote_details: IAdderQuoteDetailsSchema[];
  balance_of_system_details: IBalanceOfSystemDetailsSchema[];
  ancillary_equipment_details: IAncillaryEquipmentSchema[];
  swell_standard_markup: number;
  labor_cost: ILaborCostSchema;
  gross_price: number;
  total_net_cost: number;
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
  tax_credit_percentage: number;
  tax_credit_start_date: Date;
  tax_credit_end_date: Date;
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
  tax_credit_config_data_id: string;
  tax_credit_config_data_snapshot: ITaxCreditConfigDataSnapshotSchema;
  tax_credit_config_data_snapshot_date: Date;
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
  price_per_watt: number;
  gross_price: number;
}

const QuotePricePerWattSchema = new Schema<Document<IQuotePricePerWattSchema>>(
  {
    price_per_watt: Number,
    gross_price: Number,
  },
  { _id: false },
);

export interface IQuotePriceOverride {
  gross_price: number;
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
  show_on_proposal: boolean;
  show_on_contract: boolean;
  is_approved: boolean;
  approval_comment: string;
  approved_by: string;
  approved_at: Date | null;
}

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
  tax_credit_data: ITaxCreditDataSchema[];
  utility_program_selected_for_reinvestment: boolean;
  tax_credit_selected_for_reinvestment: boolean;
  allowed_quote_modes: QUOTE_MODE_TYPE[];
  selected_quote_mode: QUOTE_MODE_TYPE;
  quote_price_per_watt: IQuotePricePerWattSchema;
  quote_price_override: IQuotePriceOverride;
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
  opportunity_id: string;
  system_design_id: string;
  quote_model_type: string;
  detailed_quote: IDetailedQuoteSchema;
  is_sync: boolean;
  is_sync_messages: string[];
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
  is_sync: Boolean,
  is_sync_messages: [String],
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

  is_sync: boolean;

  is_sync_messages: string[];

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
        balanceOfSystemDetails,
        ancillaryEquipmentDetails,
        swellStandardMarkup,
        laborCost,
        grossPrice,
        totalNetCost,
      },
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
      system_production: systemProduction,
      quote_name: quoteName,
      is_selected: isSelected,
      is_solar: isSolar,
      is_retrofit: isRetrofit,
      utility_program: toSnakeCase(utilityProgram),
      quote_finance_product: {
        incentive_details: incentiveDetails,
        rebate_details: rebateDetails?.map(item => toSnakeCase(item)),
        finance_product: toSnakeCase(financeProduct),
        net_amount: netAmount,
        project_discount_details: projectDiscountDetails.map(item => {
          item.discount_id = item.id;
          return toSnakeCase(item);
        }),
      },
      savings_details: savingsDetails.map(item => toSnakeCase(item)),
      quote_cost_buildup: {
        panel_quote_details: panelQuoteDetails.map(panelQuote => toSnakeCase(panelQuote)),
        inverter_quote_details: inverterQuoteDetails.map(inverterQuote => toSnakeCase(inverterQuote)),
        storage_quote_details: storageQuoteDetails.map(storageQuote => toSnakeCase(storageQuote)),
        adder_quote_details: adderQuoteDetails.map(adderQuote => toSnakeCase(adderQuote)),
        balance_of_system_details: balanceOfSystemDetails.map(balanceOfSystemDetail =>
          toSnakeCase(balanceOfSystemDetail),
        ),
        ancillary_equipment_details: ancillaryEquipmentDetails.map(item => toSnakeCase(item)),
        swell_standard_markup: swellStandardMarkup,
        labor_cost: toSnakeCase(laborCost),
        gross_price: grossPrice,
        total_net_cost: totalNetCost,
      } as IQuoteCostBuildupSchema,
      tax_credit_selected_for_reinvestment: taxCreditSelectedForReinvestment,
      utility_program_selected_for_reinvestment: utilityProgramSelectedForReinvestment,
      tax_credit_data: (taxCreditData || []).map(item => ({
        tax_credit_config_data_id: item.id,
        name: item.name,
        percentage: item.percentage,
        tax_credit_config_data_snapshot: {
          name: item.name,
          percentage: item.percentage,
          start_date: item.startDate,
          end_date: item.endDate,
        },
        tax_credit_config_data_snapshot_date: new Date(),
      })),
      allowed_quote_modes: allowedQuoteModes,
      selected_quote_mode: selectedQuoteMode,
      quote_price_per_watt: {
        price_per_watt: quotePricePerWatt?.pricePerWatt,
        gross_price: quotePricePerWatt?.grossPrice,
      },
      quote_price_override: {
        gross_price: quotePriceOverride?.grossPrice,
      },
      notes: notes.map(i => ({ ...(toSnakeCase(i) as any), approved_at: i.approvedAt })),
    };
  }

  setIsSync(isSync: boolean): void {
    this.is_sync = isSync;
    if (this.is_sync) {
      this.is_sync_messages = [];
    }
  }
}

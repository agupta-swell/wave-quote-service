import { Document, Schema } from 'mongoose';
import { DiscountSchema } from 'src/discounts/discount.schema';
import { IDiscountDocument } from 'src/discounts/interfaces';
import { FinancialProduct, FinancialProductSchema } from 'src/financial-products/financial-product.schema';
import { GsProgramsSchema } from 'src/gs-programs/gs-programs.schema';
import { LeaseSolverConfig } from 'src/lease-solver-configs/lease-solver-config.schema';
import { IPromotionDocument } from 'src/promotions/interfaces';
import { PromotionSchema } from 'src/promotions/promotion.schema';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';
import { camelToSnake, deepTransform, snakeToCamel } from 'src/shared/mongoose-schema-mapper/utils/transform';
import { ISystemProductionSchema, SystemProductionSchema } from 'src/system-designs/system-design.schema';
import { ITaxCreditConfigSnapshot } from 'src/tax-credit-configs/interfaces';
import { TaxCreditConfigSnapshotSchema } from 'src/tax-credit-configs/tax-credit-config.schema';
import { QUOTE_MODE_TYPE, REBATE_TYPE } from './constants';
import { ICogsImpact, IMarginImpact, IQuoteCostBuildup } from './interfaces';
import { UpdateLatestQuoteDto } from './req';
import { CreateQuoteDto } from './req/create-quote.dto';
import { UpdateQuoteDto } from './req/update-quote.dto';
import { QuoteCostBuildupSchema } from './schemas';

export const QUOTE = Symbol('QUOTE').toString();

export interface IGsProgramSnapshot {
  id: string;
  annualIncentives: number;
  termYears: string;
  kilowattHours: number;
  upfrontIncentives: number;
  manufacturerId: string;
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

export interface IIncentiveDetailsSchema extends ICogsImpact, IMarginImpact {
  type: REBATE_TYPE;
  detail: IGridServiceDetails;
  amount: number;
}

const IncentiveDetailsSchema = new Schema<Document<IIncentiveDetailsSchema>>(
  {
    type: String,
    amount: Number,
    detail: GridServiceDetailsSchema,
    cogsAllocation: Number,
    cogsAmount: Number,
    marginAllocation: Number,
    marginAmount: Number,
  },
  { _id: false },
);

MongooseNamingStrategy.ExcludeOne(IncentiveDetailsSchema);
export interface IRebateDetailsSchema {
  amount: number;
  type: REBATE_TYPE;
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
  leaseSolverConfigSnapshot?: LeaseSolverConfig;
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

const transformProductAttributeToSnake = (str: string): string => {
  if (str === 'currentPricePerKWh') return 'current_price_per_kWh';

  if (str === 'newPricePerKWh') return 'new_price_per_kWh';

  return camelToSnake(str);
};

const transformProductAttributeToCamel = (str: string): string => {
  if (str === 'current_price_per_kWh') return 'currentPricePerKWh';

  if (str === 'new_price_per_kWh') return 'newPricePerKWh';

  return snakeToCamel(str);
};

FinanceProductSchema.pre('save', function (next) {
  const productAttribute = ((this as unknown) as IFinanceProductSchema).productAttribute;

  if (productAttribute.currentPricePerKWh === (productAttribute as any).current_price_per_kWh) {
    next();
    return;
  }

  deepTransform(productAttribute as any, transformProductAttributeToSnake, true);

  next();
});

FinanceProductSchema.post('save', (doc: IFinanceProductSchema, next) => {
  const productAttribute = doc.productAttribute;

  if (productAttribute.currentPricePerKWh === (productAttribute as any).current_price_per_kWh) {
    next();
    return;
  }

  deepTransform(productAttribute as any, transformProductAttributeToCamel, true);

  next();
});

export interface IFinancialProductDetails {
  fundingSourceId: string;
  isActive: boolean;
  name: string;
  fundId: string;
  allowDownPayment: boolean;
  minDownPayment: number;
  defaultDownPayment: number;
  maxDownPayment: number;
  maxDownPaymentPercentage: number;
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
  termMonths: number;
  dealerFee: number;
  financierId: string;
  minBatteryReserve: number;
  maxBatteryReserve: number;
  minClippingRatio: number;
  maxClippingRatio: number;
  minMarkup: number;
  maxMarkup: number;
  requiresHardCreditApproval: boolean;
  countersignerName: string;
  countersignerTitle: string;
  countersignerEmail: string;
  allowsWetSignedContracts: boolean;
  projectCompletionDateOffset: number;
  processingFee: number;
}

export interface IQuoteFinanceProductSchema {
  financeProduct: IFinanceProductSchema;
  netAmount: number;
  incentiveDetails: IIncentiveDetailsSchema[];
  rebateDetails: IRebateDetailsSchema[];
  projectDiscountDetails: IDiscountDocument[];
  promotionDetails: IPromotionDocument[];
  financialProductSnapshot: IFinancialProductDetails;
}

const QuoteFinanceProductSchema = new Schema<Document<IQuoteFinanceProductSchema>>(
  {
    finance_product: FinanceProductSchema,
    incentive_details: [IncentiveDetailsSchema],
    rebate_details: [RebateDetailsSchema],
    net_amount: Number,
    project_discount_details: [DiscountSchema],
    promotion_details: [PromotionSchema],
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

export interface IRebateProgramSchema {
  _id: string;
  name: string;
}

const RebateProgramSchema = new Schema<Document<IRebateProgramSchema>>(
  {
    _id: {
      type: String,
      alias: 'id',
    },
    name: String,
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
  systemProductionId: string;
  systemProduction: ISystemProductionSchema;
  utilityProgram: IUtilityProgramSchema;
  rebateProgram?: IRebateProgramSchema;
  quoteFinanceProduct: IQuoteFinanceProductSchema;
  savingsDetails: ISavingsDetailsSchema[];
  quoteCostBuildup: IQuoteCostBuildup;
  quoteName: string;
  isSelected: boolean;
  isSolar: boolean;
  isRetrofit: boolean;
  taxCreditData: ITaxCreditConfigSnapshot[];
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
    system_production_id: String,
    system_production: SystemProductionSchema,
    rebate_program: RebateProgramSchema,
    utility_program: UtilityProgramSchema,
    quote_finance_product: QuoteFinanceProductSchema,
    savings_details: [SavingsDetailsSchema],
    quote_cost_buildup: QuoteCostBuildupSchema,
    quote_name: String,
    is_selected: Boolean,
    is_solar: Boolean,
    is_retrofit: Boolean,
    tax_credit_data: [TaxCreditConfigSnapshotSchema],
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

  constructor(data: CreateQuoteDto | UpdateQuoteDto | UpdateLatestQuoteDto, detailedQuote: any) {
    this.opportunityId = data.opportunityId;
    this.systemDesignId = data.systemDesignId;
    this.quoteModelType = 'detailed';
    this.detailedQuote = this.transformDetailedQuote(detailedQuote);
  }

  transformDetailedQuote(data: any): IDetailedQuoteSchema {
    const {
      systemProductionId,
      systemProduction,
      utilityProgram,
      rebateProgram,
      quoteFinanceProduct: {
        netAmount,
        incentiveDetails,
        rebateDetails,
        projectDiscountDetails,
        financeProduct,
        financialProductSnapshot,
        promotionDetails,
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
      systemProductionId,
      systemProduction,
      quoteName,
      isSelected,
      isSolar,
      isRetrofit,
      utilityProgram,
      rebateProgram,
      quoteFinanceProduct: {
        incentiveDetails: incentiveDetails.map(e => ({
          ...e,
          '@@keep': true,
        })),
        rebateDetails,
        financeProduct,
        netAmount,
        projectDiscountDetails,
        promotionDetails,
        financialProductSnapshot,
      },
      savingsDetails,
      quoteCostBuildup,
      taxCreditSelectedForReinvestment,
      utilityProgramSelectedForReinvestment,
      taxCreditData,
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

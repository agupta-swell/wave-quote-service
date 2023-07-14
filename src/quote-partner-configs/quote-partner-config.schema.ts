import { Document, Schema, Types } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';

export const QUOTE_PARTNER_CONFIG = Symbol('QUOTE_PARTNER_CONFIG').toString();

export interface QuotePartnerConfig extends Document {
  partnerId: string;
  adderMarkup: number;
  defaultDCClipping: number;
  enableCostBuildup: boolean;
  enableModuleDCClipping: boolean;
  enablePriceOverride: boolean;
  enablePricePerWatt: boolean;
  enabledFinancialProducts: string[];
  maxModuleDCClipping: number;
  solarOnlyLaborFeePerWatt: number;
  solarWithACStorageLaborFeePerProject: number;
  solarWithDCStorageLaborFeePerProject: number;
  storageRetrofitLaborFeePerProject: number;
  ancillaryEquipmentMarkup: number;
  bosMarkup: number;
  generalMarkup: number;
  inverterMarkup: number;
  laborMarkup: number;
  salesOriginationManagerFee: number;
  salesOriginationSalesFee?: number;
  useFixedSalesOriginationSalesFee: boolean;
  softCostMarkup: number;
  solarMarkup: number;
  storageMarkup: number;
  defaultInverterId: Types.ObjectId;
  proposalValidityPeriod: number;
}

export const QuotePartnerConfigSchema = new Schema<QuotePartnerConfig>({
  _id: Schema.Types.Mixed,
  adderMarkup: Number,
  defaultDCClipping: Number,
  enableCostBuildup: Boolean,
  enableModuleDCClipping: Boolean,
  enablePriceOverride: Boolean,
  enablePricePerWatt: Boolean,
  enabledFinancialProducts: [String],
  maxModuleDCClipping: Number,
  solarOnlyLaborFeePerWatt: Number,
  solarWithACStorageLaborFeePerProject: Number,
  solarWithDCStorageLaborFeePerProject: Number,
  storageRetrofitLaborFeePerProject: Number,
  generalMarkup: Number,
  ancillaryEquipmentMarkup: Number,
  bosMarkup: Number,
  inverterMarkup: Number,
  laborMarkup: Number,
  salesOriginationManagerFee: Number,
  useFixedSalesOriginationSalesFee: Boolean,
  salesOriginationSalesFee: Number,
  softCostMarkup: Number,
  solarMarkup: Number,
  storageMarkup: Number,
  defaultInverterId: Types.ObjectId,
  proposalValidityPeriod: {
    type: Number,
    default: 14,
  },
});

MongooseNamingStrategy.ExcludeOne(QuotePartnerConfigSchema);

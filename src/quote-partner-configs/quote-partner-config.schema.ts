import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'mongoose-schema-mapper';

export const QUOTE_PARTNER_CONFIG = Symbol('QUOTE_PARTNER_CONFIG').toString();

export interface QuotePartnerConfig extends Document {
  partnerId: string;
  enableCostBuildup: boolean;
  enablePricePerWatt: boolean;
  enablePriceOverride: boolean;

  //! will remove start
  enableModuleDCClipping: boolean;
  pricePerWatt: number;
  defaultDCClipping: number;
  maxModuleDCClipping: number;
  solarOnlyLaborFeePerWatt: number;
  storageRetrofitLaborFeePerProject: number;
  solarWithACStorageLaborFeePerProject: number;
  solarWithDCStorageLaborFeePerProject: number;
  swellStandardMarkup: number;
  //! will remove end

  generalMarkup: number;
  enabledFinancialProducts: string[];
  solarMarkup: number;
  storageMarkup: number;
  inverterMarkup: number;
  ancillaryEquipmentMarkup: number;
  softCostMarkup: number;
  bosMarkup: number;
  laborMarkup: number;
  salesOriginationManagerFee: number;
  salesOriginationSalesFee: number;
}

export const QuotePartnerConfigSchema = new Schema<QuotePartnerConfig>({
  _id: Schema.Types.Mixed,
  partnerId: String,
  enableCostBuildup: Boolean,
  enablePricePerWatt: Boolean,
  enablePriceOverride: Boolean,

  //! will remove start
  enableModuleDCClipping: Boolean,
  pricePerWatt: Number,
  defaultDCClipping: Number,
  maxModuleDCClipping: Number,
  solarOnlyLaborFeePerWatt: Number,
  storageRetrofitLaborFeePerProject: Number,
  solarWithACStorageLaborFeePerProject: Number,
  solarWithDCStorageLaborFeePerProject: Number,
  swellStandardMarkup: Number,
  //! will remove end

  generalMarkup: Number,
  enabledFinancialProducts: Array,
  solarMarkup: Number,
  storageMarkup: Number,
  inverterMarkup: Number,
  ancillaryEquipmentMarkup: Number,
  softCostMarkup: Number,
  bosMarkup: Number,
  laborMarkup: Number,
  salesOriginationManagerFee: Number,
  salesOriginationSalesFee: Number,
});

MongooseNamingStrategy.ExcludeOne(QuotePartnerConfigSchema);

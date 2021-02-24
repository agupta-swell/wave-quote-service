import { Document, Schema } from 'mongoose';

export const QUOTE_PARTNER_CONFIG = Symbol('QUOTE_PARTNER_CONFIG').toString();

export interface QuotePartnerConfig extends Document {
  partnerId: string;
  enableCostBuildup: boolean;
  enablePricePerWatt: boolean;
  enablePriceOverride: boolean;
  enableModuleDCClipping: boolean;
  pricePerWatt: number;
  defaultDCClipping: number;
  maxModuleDCClipping: number;
  solarOnlyLaborFeePerWatt: number;
  storageRetrofitLaborFeePerProject: number;
  solarWithACStorageLaborFeePerProject: number;
  solarWithDCStorageLaborFeePerProject: number;
  swellStandardMarkup: number;
}

export const QuotePartnerConfigSchema = new Schema<QuotePartnerConfig>({
  _id: Schema.Types.Mixed,
  partnerId: String,
  enableCostBuildup: Boolean,
  enablePricePerWatt: Boolean,
  enablePriceOverride: Boolean,
  enableModuleDCClipping: Boolean,
  pricePerWatt: Number,
  defaultDCClipping: Number,
  maxModuleDCClipping: Number,
  solarOnlyLaborFeePerWatt: Number,
  storageRetrofitLaborFeePerProject: Number,
  solarWithACStorageLaborFeePerProject: Number,
  solarWithDCStorageLaborFeePerProject: Number,
  swellStandardMarkup: Number,
});

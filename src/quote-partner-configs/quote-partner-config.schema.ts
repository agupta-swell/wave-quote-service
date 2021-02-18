import { Document, Schema } from 'mongoose';

export const V2_QUOTE_PARTNER_CONFIG = Symbol('V2_QUOTE_PARTNER_CONFIG').toString();

export interface V2QuotePartnerConfig extends Document {
  partnerId: string;
  enableCostBuildup: boolean;
  enablePricePerWatt: boolean;
  enablePriceOverrideMode: boolean;
  pricePerWatt: number;
  defaultDCClipping: number;
  maxModuleDCClipping: number;
  solarOnlyLaborFeePerWatt: number;
  storageRetrofitLaborFeePerProject: number;
  solarWithACStorageLaborFeePerProject: number;
  solarWithDCStorageLaborFeePerProject: number;
  swellStandardMarkup: number;
}

export const V2QuotePartnerConfigSchema = new Schema<V2QuotePartnerConfig>({
  _id: Schema.Types.Mixed,
  partnerId: String,
  enableCostBuildup: Boolean,
  enablePricePerWatt: Boolean,
  enablePriceOverrideMode: Boolean,
  pricePerWatt: Number,
  defaultDCClipping: Number,
  maxModuleDCClipping: Number,
  solarOnlyLaborFeePerWatt: Number,
  storageRetrofitLaborFeePerProject: Number,
  solarWithACStorageLaborFeePerProject: Number,
  solarWithDCStorageLaborFeePerProject: Number,
  swellStandardMarkup: Number,
});

import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'mongoose-schema-mapper';

export const QUOTE_PARTNER_CONFIG = Symbol('QUOTE_PARTNER_CONFIG').toString();

export interface QuotePartnerConfig extends Document {
  partnerId: string;
  enableCostBuildup: boolean;
  enablePricePerWatt: boolean;
  enablePriceOverride: boolean;
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

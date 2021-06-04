import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'mongoose-schema-mapper';
import { COMPONENT_TYPE, PRODUCT_CATEGORY_TYPE } from 'src/system-designs/constants';

export const QUOTE_MARKUP_CONFIG = Symbol('QUOTE_MARKUP_CONFIG').toString();

export interface QuoteMarkupConfig extends Document {
  partnerId: string;
  productCategory: PRODUCT_CATEGORY_TYPE;
  productType: COMPONENT_TYPE;
  subcontractorMarkup: number;
}

export const QuoteMarkupConfigSchema = new Schema<QuoteMarkupConfig>({
  _id: Schema.Types.Mixed,
  partnerId: String,
  productCategory: String,
  productType: String,
  subcontractorMarkup: Number,
});

MongooseNamingStrategy.ExcludeOne(QuoteMarkupConfigSchema);

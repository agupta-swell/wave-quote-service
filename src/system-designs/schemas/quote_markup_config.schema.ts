import { Document, Schema } from 'mongoose';
import { COMPONENT_TYPE, PRODUCT_CATEGORY_TYPE } from '../constants';

export const QUOTE_MARKUP_CONFIG = Symbol('QUOTE_MARKUP_CONFIG').toString();

export interface QuoteMarkupConfig extends Document {
  product_type: COMPONENT_TYPE;
  product_category: PRODUCT_CATEGORY_TYPE;
  partner_id: string;
  sub_contractor_mark_up: number;

  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const QuoteMarkupConfigSchema = new Schema<QuoteMarkupConfig>({
  product_type: String,
  product_category: String,
  partner_id: String,
  sub_contractor_mark_up: Number,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

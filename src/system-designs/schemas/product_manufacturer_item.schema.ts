import { Document, Schema } from 'mongoose';

export const PRODUCT_MANUFACTURER_ITEM = Symbol('PRODUCT_MANUFACTURER_ITEM').toString();

export interface ProductManufacturerItem extends Document {
  name: string;

  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const ProductManufacturerItemSchema = new Schema<ProductManufacturerItem>({
  name: String,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

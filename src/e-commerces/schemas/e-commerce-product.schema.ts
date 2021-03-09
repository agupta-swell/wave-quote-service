import { Document, Schema } from 'mongoose';
import { ECOM_PRODUCT_TYPE } from '../constants';

export const E_COMMERCE_PRODUCT = Symbol('E_COMMERCE_PRODUCT').toString();

export interface ECommerceProduct extends Document {
  type: ECOM_PRODUCT_TYPE;
  manufacturer: string;
  model_name: string;
  sizeW: number;
  price: number;

  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const ECommerceProductSchema = new Schema<ECommerceProduct>({
  type: String,
  manufacturer: String,
  model_name: String,
  sizeW: Number,
  price: Number,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

export const ECommerceProductSchemaWithoutId = new Schema<ECommerceProduct>(
  {
    type: String,
    manufacturer: String,
    model_name: String,
    sizeW: Number,
    price: Number,

    created_at: { type: Date, default: Date.now },
    created_by: String,
    updated_at: { type: Date, default: Date.now },
    updated_by: String,
  },
  { _id: false },
);

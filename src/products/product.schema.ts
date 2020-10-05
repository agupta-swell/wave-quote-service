import { Document, Schema } from 'mongoose';

export const PRODUCT = Symbol('Product').toString();

export interface Product extends Document {
  manufacturer: string;
  name: string;
  type: string;
  price: number;
  sizeW: number;
  sizekWh: number;
  partNumber: string[];
  dimension: {
    length: number;
    width: number;
  };
  created_at: Date;
  updated_at: Date;
}

export const ProductSchema = new Schema<Product>({
  _id: Schema.Types.Mixed,
  manufacturer: String,
  name: String,
  type: String,
  price: Number,
  sizeW: Number,
  sizekWh: Number,
  dimension: {
    length: Number,
    width: Number,
  },
  partNumber: [String],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

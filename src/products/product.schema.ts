import { Document, Schema } from 'mongoose';

export const PRODUCT = Symbol('Product').toString();

export interface Product extends Document {
  name: string;
  type: string;
  price: number;
  sizeW: number;
  sizekWh: number;
  partNumber: string[];
  created_at: Date;
  updated_at: Date;
}

export const ProductSchema = new Schema<Product>({
  name: String,
  type: String,
  price: Number,
  sizeW: Number,
  sizekWh: Number,
  partNumber: [String],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

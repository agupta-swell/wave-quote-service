import { Document, Schema } from 'mongoose';

export interface ProductionDeratesDocument extends Document {
  name: string;
  description: string;
  amount: number;
}

export const ProductionDeratesSchema = new Schema<ProductionDeratesDocument>({
  name: String,
  description: String,
  amount: Number,
});

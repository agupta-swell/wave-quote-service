import { Document, Schema } from 'mongoose';

export const DISCOUNTS = Symbol('DISCOUNTS').toString();

export interface Discounts extends Document {
  _id: string;
  name: string;
  type: string;
  amount: number;
  startDate: Date;
  endDate: Date;
}

export const DiscountsSchema = new Schema<Discounts>({
  _id: Schema.Types.Mixed,
  name: String,
  type: String,
  amount: Number,
  startDate: Date,
  endDate: Date,
});

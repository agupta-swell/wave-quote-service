import { Document, Schema } from 'mongoose';

export interface Financier extends Document {
  _id: string;
  name: string;
}

export const FinancierSchema = new Schema({
  name: String,
});

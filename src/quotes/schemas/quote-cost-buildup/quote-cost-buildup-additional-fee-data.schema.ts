import { Document, Schema } from 'mongoose';
import { IAdditionalFees } from 'src/quotes/interfaces';

export const AdditionalFeesSchema = new Schema<Document & IAdditionalFees>(
  { total: Number, cogs_amount: Number, margin_amount: Number },
  { _id: false },
);

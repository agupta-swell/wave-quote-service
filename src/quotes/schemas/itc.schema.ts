import { Document, Schema } from 'mongoose';

export const I_T_C = Symbol('I_T_C').toString();

export interface ITC extends Document {
  itcRate: number;
}

export const ITCSchema = new Schema<ITC>({
  itc_rate: Number,
});

import { Document, Schema } from 'mongoose';

export const UTILITIES = Symbol('UTILITIES').toString();

export interface Utilities extends Document {
  name: string;
}

export const UtilitiesSchema = new Schema<Utilities>({
  name: String,
});

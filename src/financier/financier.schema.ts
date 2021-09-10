import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'mongoose-schema-mapper';

export interface Financier extends Document {
  _id: string;
  name: string;
  isActive: boolean;
}

export const FinancierSchema = new Schema({
  name: String,
  isActive: Boolean
});

MongooseNamingStrategy.ExcludeOne(FinancierSchema);

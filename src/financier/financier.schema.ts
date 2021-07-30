import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'mongoose-schema-mapper';

export interface Financier extends Document {
  _id: string;
  name: string;
}

export const FinancierSchema = new Schema({
  name: String,
});

MongooseNamingStrategy.ExcludeOne(FinancierSchema);

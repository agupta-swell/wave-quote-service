import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';

export const ADDER_CONFIG = Symbol('AdderConfig').toString();

export interface AdderConfig extends Document {
  _id: string;
  adder: string;
  price: number;
  increment: string | any;
  modifiedAt: Date;
}

export const AdderConfigSchema = new Schema<AdderConfig>({
  _id: String,
  adder: String,
  price: Number,
  increment: String,
  modifiedAt: { type: Date, default: Date.now },
});

MongooseNamingStrategy.ExcludeOne(AdderConfigSchema);

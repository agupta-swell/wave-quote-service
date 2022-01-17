import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';

export const UTILITIES = Symbol('UTILITIES').toString();

export interface Utilities extends Document {
  name: string;
}

export const UtilitiesSchema = new Schema<Utilities>({
  _id: Schema.Types.Mixed,
  name: String,
});

MongooseNamingStrategy.ExcludeOne(UtilitiesSchema);

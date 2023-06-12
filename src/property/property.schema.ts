import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';

export interface PropertyHomeowners extends Document {
  contactId: string;
  isPrimary: boolean;
}

export interface PropertyDocument extends Document {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  lat?: number;
  lng?: number;
  county?: string;
  homeowners: PropertyHomeowners[];
}

export const PropertyHomeownersSchema = new Schema<PropertyHomeowners>(
  {
    contactId: String,
    isPrimary: Boolean,
  },
  { _id: false },
);

export const PropertiesSchema = new Schema<PropertyDocument>({
  _id: Schema.Types.Mixed,
  address1: { type: String },
  address2: { type: String, optional: true },
  city: { type: String },
  state: { type: String },
  zip: { type: String },
  lat: { type: Number, optional: true, decimal: true },
  lng: { type: Number, optional: true, decimal: true },
  homeowners: { type: [PropertyHomeownersSchema] },
});

MongooseNamingStrategy.ExcludeOne(PropertiesSchema);

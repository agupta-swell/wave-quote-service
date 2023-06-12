import { randomBytes } from 'crypto';
import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';

export const CONTACT = Symbol('CONTACT').toString();

export interface Contact extends Document {
  email: string;
  firstName: string;
  lastName: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  cellPhone?: string;
  contactId: string;
  lat?: number;
  lng?: number;
  county?: string;
  primaryPhone?: string;
  businessPhone?: string;
}

export const ContactSchema = new Schema<Contact>(
  {
    _id: Schema.Types.Mixed,
    email: String,
    firstName: String,
    lastName: String,
    address1: { type: String, optional: true },
    address2: { type: String, optional: true },
    city: { type: String, optional: true },
    state: { type: String, optional: true },
    zip: { type: String, optional: true },
    cellPhone: { type: String, optional: true },
    businessPhone: { type: String, optional: true },
    primaryPhone: { type: String, optional: true },
    contactId: String,
    lat: {
      type: Number,
      optional: true,
      decimal: true,
    },
    lng: {
      type: Number,
      optional: true,
      decimal: true,
    },
    county: { type: String, optional: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'modifiedAt' },
    versionKey: false,
  },
);

ContactSchema.pre('save', function (next) {
  if (!this._id) {
    this._id = randomBytes(8).toString('hex');
  }

  next();
});

MongooseNamingStrategy.ExcludeOne(ContactSchema);

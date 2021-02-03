import { Document, Schema } from 'mongoose';

export const CONTACT = Symbol('CONTACT').toString();

export interface Contact extends Document {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  cellPhone: string;
  contactId: string;
  lat: string;
  long: string;
}

export const ContactSchema = new Schema<Contact>({
  _id: Schema.Types.Mixed,
  email: String,
  firstName: String,
  lastName: String,
  address1: String,
  address2: String,
  city: String,
  state: String,
  zip: String,
  cellPhone: String,
  contactId: String,
  lat: String,
  long: String,
});

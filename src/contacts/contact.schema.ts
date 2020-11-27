import { Document, Schema } from 'mongoose';

export const CONTACT = Symbol('CONTACT').toString();

export interface Contact extends Document {
  email: string;
}

export const ContactSchema = new Schema<Contact>({
  _id: Schema.Types.Mixed,
  email: String,
});

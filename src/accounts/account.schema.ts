import { Document, Schema } from 'mongoose';

export const ACCOUNT = Symbol('ACCOUNT').toString();

export interface Account extends Document {
  _id: string;
  fundingSourceAccess: string[];
}

export const AccountSchema = new Schema<Account>({
  _id: String,
  fundingSourceAccess: [String],

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

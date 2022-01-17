import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';

export const ACCOUNT = Symbol('ACCOUNT').toString();

export namespace Account {
  export type Tier = 'DTC' | 'TIER_1' | 'TIER_2' | 'TIER_3';
}
export interface Account extends Document {
  _id: string;
  fundingSourceAccess: string[];
  swellESAPricingTier?: Account.Tier;
}

export const AccountSchema = new Schema<Account>({
  _id: String,
  fundingSourceAccess: [String],
  swellESAPricingTier: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

MongooseNamingStrategy.ExcludeOne(AccountSchema);

import { Document, Schema } from 'mongoose';

export const OPPORTUNITY = Symbol('OPPORTUNITY').toString();

export interface Opportunity extends Document {
  contactId: string;
  utilityId: string;
  fundingSourceId: string;
}

export const OpportunitySchema = new Schema<Opportunity>({
  _id: Schema.Types.Mixed,
  contactId: String,
  utilityId: String,
  fundingSourceId: String,
});

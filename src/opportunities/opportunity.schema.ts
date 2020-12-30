import { Document, Schema } from 'mongoose';

export const OPPORTUNITY = Symbol('OPPORTUNITY').toString();

export interface Opportunity extends Document {
  contactId: string;
  utilityId: string;
  fundingSourceId: string;
  contractorCompanyName: string;
  contractorAddress1: string;
  contractorAddress2: string;
  contractorLicense: string;
  amount: number;
  isPrimeContractor: boolean;
  contractorEmail: string;
  contractorSigner: string;
  recordOwner: string;
}

export const OpportunitySchema = new Schema<Opportunity>({
  _id: Schema.Types.Mixed,
  contactId: String,
  utilityId: String,
  fundingSourceId: String,
  contractorCompanyName: String,
  contractorAddress1: String,
  contractorAddress2: String,
  contractorLicense: String,
  amount: Number,
  isPrimeContractor: Boolean,
  contractorEmail: String,
  contractorSigner: String,
  recordOwner: String,
});

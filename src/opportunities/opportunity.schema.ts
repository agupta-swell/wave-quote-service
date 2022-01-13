import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';
import { FINANCE_TYPE_EXISTING_SOLAR, INVERTER_TYPE_EXISTING_SOLAR } from 'src/system-designs/constants';

export const OPPORTUNITY = Symbol('OPPORTUNITY').toString();

export interface Opportunity extends Document {
  name: string;
  contactId: string;
  utilityId: string;
  utilityProgramId: string;
  rebateProgramId: string;
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
  accountId: string;
  existingPV: boolean;
  hasHadOtherDemandResponseProvider: boolean;
  hasGrantedHomeBatterySystemRights: boolean;
  originalInstaller: string;
  existingPVSize: number;
  yearSystemInstalled: number;
  inverter: INVERTER_TYPE_EXISTING_SOLAR;
  financeType: FINANCE_TYPE_EXISTING_SOLAR;
  inverterManufacturer: string;
  inverterModel: string;
  tpoFundingSource: string;
  assignedMember: string;
}

export const OpportunitySchema = new Schema<Opportunity>({
  _id: Schema.Types.Mixed,
  contactId: String,
  utilityId: String,
  utilityProgramId: String,
  rebateProgramId: String,
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
  accountId: String,
  existingPV: Boolean,
  hasHadOtherDemandResponseProvider: Boolean,
  hasGrantedHomeBatterySystemRights: Boolean,
  originalInstaller: String,
  existingPVSize: Number,
  yearSystemInstalled: Number,
  inverter: String,
  financeType: String,
  inverterManufacturer: String,
  inverterModel: String,
  tpoFundingSource: String,
  assignedMember: String,
});

MongooseNamingStrategy.ExcludeOne(OpportunitySchema);

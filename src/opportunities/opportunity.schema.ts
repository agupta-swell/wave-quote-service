import { Document, Schema } from 'mongoose';
import { PRIMARY_QUOTE_TYPE } from 'src/quotes/constants';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';
import { FINANCE_TYPE_EXISTING_SOLAR, INVERTER_TYPE_EXISTING_SOLAR } from 'src/system-designs/constants';

export const OPPORTUNITY = Symbol('OPPORTUNITY').toString();

export interface UpdateOpportunityTitleNameMatchType {
  alternateTitleDocumentationSubmitted: boolean;
  alternateTitleDocumentationSubmitDate: Date;
  alternateTitleDocumentationName: string;
  alternateTitleDocumentationAddress: string;
  applicantNameMatchesTitle: boolean;
  coapplicantNameMatchesTitle: boolean;
}

export interface IElectronicPaymentSettings {
  deposit: number;
  depositPayPercent: boolean;
  payment1: number;
  payment1PayPercent: boolean;
  payment2: number;
  payment2PayPercent: boolean;
  payment2PayBalance: boolean;
}

export type ElectronicPaymentSettings = Document & IElectronicPaymentSettings;

export const ElectronicPaymentSettingsSchema = new Schema<ElectronicPaymentSettings>(
  {
    deposit: Number,
    depositPayPercent: Boolean,
    payment1: Number,
    payment1PayPercent: Boolean,
    payment2: Number,
    payment2PayPercent: Boolean,
    payment2PayBalance: Boolean,
  },
  { _id: false },
);

export interface Opportunity extends Document, Partial<UpdateOpportunityTitleNameMatchType> {
  name: string;
  propertyId: string;
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
  existingPVTilt: number;
  existingPVAzimuth: number;
  assignedMember: string;
  gsTermYears?: string;
  primaryQuoteType: PRIMARY_QUOTE_TYPE;
  interconnectedWithExistingSystem: boolean;
  applicantName?: string;
  coapplicantName?: string;
  applicantCreditApproved?: boolean;
  coapplicantCreditApproved?: boolean;
  onTitleName?: string;
  onTitleAddress?: string;
  electronicPaymentSettings: IElectronicPaymentSettings;
}

export const OpportunitySchema = new Schema<Opportunity>({
  _id: Schema.Types.Mixed,
  propertyId: String,
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
  existingPVTilt: Number,
  existingPVAzimuth: Number,
  assignedMember: String,
  gsTermYears: String,
  primaryQuoteType: String,
  interconnectedWithExistingSystem: Boolean,
  applicantName: String,
  coapplicantName: String,
  applicantCreditApproved: Boolean,
  coapplicantCreditApproved: Boolean,
  onTitleName: String,
  onTitleAddress: String,
  alternateTitleDocumentationSubmitted: Boolean,
  alternateTitleDocumentationSubmitDate: Date,
  alternateTitleDocumentationName: String,
  alternateTitleDocumentationAddress: String,
  applicantNameMatchesTitle: Boolean,
  coapplicantNameMatchesTitle: Boolean,
  electronicPaymentSettings: ElectronicPaymentSettingsSchema,
});

MongooseNamingStrategy.ExcludeOne(OpportunitySchema);

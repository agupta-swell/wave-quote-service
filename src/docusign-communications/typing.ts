import { LeanDocument } from 'mongoose';
import { Contact } from 'src/contacts/contact.schema';
import { Contract, ISignerDetailDataSchema } from 'src/contracts/contract.schema';
import { CustomerPayment } from 'src/customer-payments/customer-payment.schema';
import { LeaseSolverConfig } from 'src/lease-solver-configs/lease-solver-config.schema';
import { Opportunity } from 'src/opportunities/opportunity.schema';
import { PropertyDocument } from 'src/property/property.schema';
import { IDetailedQuoteSchema, IFinancialProductDetails, IGsProgramSnapshot } from 'src/quotes/quote.schema';
import { IRoofTopSchema, SystemDesignWithManufacturerMeta } from 'src/system-designs/system-design.schema';
import { User } from 'src/users/user.schema';
import { UtilityUsageDetails } from 'src/utilities/utility.schema';
import { UtilityProgramMaster } from 'src/utility-programs-master/utility-program-master.schema';

export interface ITextTabData {
  [keyName: string]: string;
}

export interface ITabData {
  textTabs?: ITextTabData[];
}

export interface ISignerData {
  email: string;
  name: string;
  recipientId: string;
  roleName: string;
  routingOrder: string;
  tabs: ITabData;
  templateId: string;
}

export interface IRecipientData {
  signers: ISignerData[];
  carbonCopies: Omit<ISignerData, 'tabs' | 'templateId' | 'roleName'>[];
}

export interface IInlineTemplate {
  sequence: number;
  recipients: IRecipientData;
}

export interface IServerTemplate {
  sequence: number;
  templateId: string;
}

export interface ICompositeTemplate {
  serverTemplates: IServerTemplate[];
  inlineTemplates: IInlineTemplate[];
}

export interface IDocusignCompositeContract {
  emailSubject: string;
  emailBlurb: string;
  status: string;
  compositeTemplates: ICompositeTemplate[];
}

export interface IGenericObject {
  signerDetails: ISignerDetailDataSchema[];
  opportunity: LeanDocument<Opportunity>;
  quote: IDetailedQuoteSchema;
  contact: Contact;
  property: LeanDocument<PropertyDocument> | PropertyDocument;
  recordOwner: User;
  customerPayment: CustomerPayment;
  utilityName: string;
  isCash: boolean;
  roofTopDesign: IRoofTopSchema;
  assignedMember: LeanDocument<User> | null;
  gsProgram?: IGsProgramSnapshot;
  utilityProgramMaster: LeanDocument<UtilityProgramMaster> | null;
  leaseSolverConfig: LeaseSolverConfig | null;
  financialProduct?: IFinancialProductDetails;
  contract?: LeanDocument<Contract>;
  systemDesign: SystemDesignWithManufacturerMeta;
  utilityUsageDetails?: LeanDocument<UtilityUsageDetails>;
  primaryContractQuote?: IDetailedQuoteSchema;
  primaryContract?: LeanDocument<Contract>;
}

export interface IGenericObjectForGSP {
  signerDetails: ISignerDetailDataSchema[];
  contract?: LeanDocument<Contract>;
  contact: Contact;
  property: LeanDocument<PropertyDocument> | PropertyDocument;
  utilityProgramMaster: LeanDocument<UtilityProgramMaster> | null;
}

// ==================== DOCUSIGN PAYLOAD ====================

export interface IRecipientStatus {
  Email: string[];
  Status: string[];
  Sent: string[];
  Signed: string[];
}

export interface IDocusignPayload {
  RecipientStatuses: IRecipientStatus[];
  TimeGenerated: string[];
  EnvelopeID: string[];
  Subject: string[];
  UserName: string[];
  Email: string[];
  Status: string[];
  Created: string[];
  Sent: string[];
  ACStatus: string[];
  ACStatusDate: string[];
  ACHolder: string[];
  ACHolderEmail: string[];
  ACHolderLocation: string[];
  SigningLocation: string[];
  SenderIPAddress: string[];
  EnvelopePDFHash: string[];
  CustomFields: any;
  AutoNavigation: string[];
  EnvelopeIdStamping: string[];
  AuthoritativeCopy: string[];
  DocumentStatuses: any;
}

export interface ISendDocusignToContractResponse {
  status: string;
  contractingSystemReferenceId?: string;
}

export enum CONTRACTING_SYSTEM_STATUS {
  SENT = 'SENT',
  SIGNED = 'SIGNED',
}

export interface ISignerDetailFromContractingSystemData {
  emailId: string;
  status: CONTRACTING_SYSTEM_STATUS;
  date: string;
}

export interface IContractSignerDetails {
  contractSystemReferenceId: string;
  contractingSystem: string;
  overallContractStatus: string;
  statusesData: ISignerDetailFromContractingSystemData[];
}

export type DocuSignEnv = 'demo' | 'live';

export interface IDocusignTemplateMapping {
  CA_CONSUMER_GUIDE: string;
  CONTRACT_ONE: string;
  SOLAR_ENERGY_DISCLOSURE_ESA: string;
  DISCLOSURES_ESA: string;
  ADDITIONAL_TERMS_ESA: string;
  SWELL_SERVICE_ESA_X1: string;
  LIMITED_WARRANTIES_ESA_X2: string;
  CUSTOMER_OBLIGATIONS_X3: string;
  ARBITRATION_X4: string;
  NOTICE_OF_CANCELLATION_X5: string;
  CA_NOTICE_AND_DISC_X6: string;
  SYSTEM_DESIGN_NOTICE_X8: string;
  INSURANCE_X9: string;
  AUTOMATIC_PAYMENT_AUTHORIZATION_FORM_FIN: string;
  PARTICIPATION_PRP2_ACES_CASH: string;
  PARTICIPATION_PRP2_ACES_ESA: string;
  SOLAR_ENERGY_SYSTEM_ESTIMATED_X7: string;
  GRID_SERVICES_PACKET: string;
  HOME_ENERGY_SUB_AGT_ESA: string;
  PAYMENT_SCHEDULE_X10: string;
  DUMMY_PRIMARY_CONTRACT: string;
  DUMMY_GSA: string;
  DUMMY_ACES_PA: string;
  DUMMY_PRP2_PA: string;
  DUMMY_SGIP_PA: string;
  DUMMY_CHANGE_ORDER: string;
  DUMMY_NO_COST_CHANGE_ORDER: string;
}
export interface IDisclosureEsaMapping {
  salesPersonFirstLast: string;
  hisSale: string;
}

export enum REQUEST_TYPE {
  OUTBOUND = 'OUTBOUND',
  INBOUND = 'INBOUND',
}

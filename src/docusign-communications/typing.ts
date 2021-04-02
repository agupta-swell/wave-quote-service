import { LeanDocument } from 'mongoose';
import { Contact } from 'src/contacts/contact.schema';
import { Contract } from 'src/contracts/contract.schema';
import { CustomerPayment } from 'src/customer-payments/customer-payment.schema';
import { Opportunity } from 'src/opportunities/opportunity.schema';
import { IDetailedQuoteSchema } from 'src/quotes/quote.schema';
import { IRoofTopSchema } from 'src/system-designs/system-design.schema';
import { User } from 'src/users/user.schema';

export interface ITextTabData {
  [keyName: string]: string;
}

export interface ITabData {
  textTabs: ITextTabData[];
}

export interface ISignerData {
  email: string;
  name: string;
  recipientId: string;
  roleName: string;
  routingOrder: number;
  tabs: ITabData;
}

export interface IRecipientData {
  signers: ISignerData[];
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
  contract: LeanDocument<Contract>;
  opportunity: LeanDocument<Opportunity>;
  quote: IDetailedQuoteSchema;
  contact: Contact;
  recordOwner: User;
  customerPayment: CustomerPayment;
  utilityName: string;
  isCash: boolean;
  roofTopDesign: IRoofTopSchema;
  assignedMember?: IDisclosureEsaMapping;
}

export interface IDefaultContractor {
  license: string;
  address2: string;
  address1: string;
  companyName: string;
  email: string;
  signer: string;
}

export interface IDocusignSecretManager {
  docusignPartnerD2C: {
    baseUrl: string;
    password: string;
    integratorKey: string;
    accountName: string;
    email: string;
  };
  docusign: {
    baseUrl: string;
    password: string;
    integratorKey: string;
    templateId: string;
    email: string;
    defaultContractor: IDefaultContractor;
  };
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
  ARBITRATION_X4: string;
  NOTICE_OF_CANCELLATION_X5: string;
  SYSTEM_DESIGN_NOTICE_X8: string;
  AUTOMATIC_PAYMENT_AUTHORIZATION_FORM_FIN: string;
}
export interface IDisclosureEsaMapping {
  salesPersonFirstLast: string;
  hisSale: string;
}

export enum REQUEST_TYPE {
  OUTBOUND = 'OUTBOUND',
  INBOUND = 'INBOUND',
}

export type TemplateDataBuilder = (
  genericObject: IGenericObject,
  defaultContractor: IDefaultContractor,
) => {
  [key: string]: string;
};

export type TemplateBuilderMap = {
  [key: string]: TemplateDataBuilder;
};

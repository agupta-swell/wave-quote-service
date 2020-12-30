import { Contact } from 'src/contacts/contact.schema';
import { Contract } from 'src/contracts/contract.schema';
import { Opportunity } from 'src/opportunities/opportunity.schema';
import { IDetailedQuoteSchema } from 'src/quotes/quote.schema';
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
  contract: Contract;
  opportunity: Opportunity;
  quote: IDetailedQuoteSchema;
  contact: Contact;
  recordOwner: User;
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

// DOCUSIGN PAYLOAD

export interface IRecipientStatus {
  Email: string[];
  Status: string[];
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

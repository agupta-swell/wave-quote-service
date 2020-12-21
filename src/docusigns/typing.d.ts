import { Contract } from 'src/contracts/contract.schema';
import { Opportunity } from 'src/opportunities/opportunity.schema';
import { Quote } from 'src/quotes/quote.schema';
export interface ITextTabData {
  keyName: string;
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
  tabs: ITabData[];
}

export interface IRecipientData {
  signers: ISignerData[];
}

export interface IInlineTemplate {
  sequence: number;
  recipient: IRecipientData;
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
  quote: Quote;
}

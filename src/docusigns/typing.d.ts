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
  routingOrder: string;
  tabs: ITabData[];
}

export interface IRecipientData {
  signers: ISignerData[];
}

export interface IInlineTemplate {
  sequence: string;
  recipient: IRecipientData;
}

export interface IServerTemplate {
  sequence: string;
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

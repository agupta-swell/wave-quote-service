import { IDefaultContractor } from './IDefaultContractor';

export interface IDocusignAwsSecretPayload {
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

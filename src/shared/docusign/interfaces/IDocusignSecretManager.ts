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
  };
}

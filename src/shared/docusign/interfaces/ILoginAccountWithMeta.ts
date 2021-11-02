import { LoginAccount } from 'docusign-esign';

export interface ILoginAccountWithMeta extends LoginAccount {
  headers: Record<string, string>;
}

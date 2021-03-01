import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as docusign from 'docusign-esign';
import { EnvelopeSummary } from 'docusign-esign';
import { MyLogger } from 'src/app/my-logger/my-logger.service';
import { IDocusignCompositeContract, IDocusignSecretManager } from '../../docusign-communications/typing';

@Injectable()
export class DocusignAPIService {
  client: AWS.SecretsManager;

  apiClient: docusign.ApiClient;

  constructor(private readonly logger: MyLogger) {
    this.client = new AWS.SecretsManager({
      region: process.env.AWS_REGION,
    });
  }

  async createConnection() {
    const docusignKeys = await this.getDocusignSecret();

    const docusignAPI = docusignKeys?.docusign;
    this.apiClient = new docusign.ApiClient({ basePath: docusignAPI.baseUrl, oAuthBasePath: null });

    // create JSON formatted auth header
    const creds = JSON.stringify({
      Username: docusignAPI.email,
      Password: docusignAPI.password,
      IntegratorKey: docusignAPI.integratorKey,
    });

    this.apiClient.addDefaultHeader('X-DocuSign-Authentication', creds);

    const authApi = new docusign.AuthenticationApi(this.apiClient);

    try {
      const res = await authApi.login({ apiPassword: 'true', includeAccountIdGuid: 'true' });
      const { loginAccounts } = res;
      const loginAccount = loginAccounts[0];
      const { baseUrl } = loginAccount;
      const accountDomain = baseUrl.split('/v2');
      this.apiClient.setBasePath(accountDomain[0]);
      return loginAccount;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async sendTemplate(templateData: IDocusignCompositeContract): Promise<EnvelopeSummary | null> {
    const account = await this.createConnection();

    const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
    let results: EnvelopeSummary;

    try {
      results = await envelopesApi.createEnvelope(account.accountId, { envelopeDefinition: templateData });
      return results;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async getDocusignSecret(docusignSecretsName?: string): Promise<IDocusignSecretManager> {
    let secret: string; let
      decodedBinarySecret: string;

    try {
      const data = await this.client
        .getSecretValue({ SecretId: docusignSecretsName || process.env.DOCUSIGN_SECRET_NAME })
        .promise();
      if ('SecretString' in data) {
        secret = data.SecretString;
      } else {
        const buff = Buffer.from(data.SecretBinary.toString(), 'base64');
        decodedBinarySecret = buff.toString('ascii');
      }
    } catch (error) {
      console.error('>>>>>>>>>>>>>>>>>>>', 'DocusignAPIService -> decode secret error', error);
    }

    return JSON.parse(secret || decodedBinarySecret) as IDocusignSecretManager;
  }
}

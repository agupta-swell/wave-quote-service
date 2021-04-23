import * as https from 'https';
import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as docusign from 'docusign-esign';
import { EnvelopeSummary } from 'docusign-esign';
import { MyLogger } from 'src/app/my-logger/my-logger.service';
import { ApplicationException } from 'src/app/app.exception';
import { IncomingMessage } from 'http';
import { CredentialService } from 'src/shared/aws/services/credential.service';
import { IDocusignCompositeContract, IDocusignSecretManager } from '../../docusign-communications/typing';
import { ILoginAccountWithMeta } from '../typing';

@Injectable()
export class DocusignAPIService {
  client: AWS.SecretsManager;

  apiClient: docusign.ApiClient;

  constructor(private readonly logger: MyLogger, private readonly credentialService: CredentialService) {
    this.client = new AWS.SecretsManager(this.credentialService.getCredentials());
  }

  // eslint-disable-next-line consistent-return
  async createConnection(): Promise<ILoginAccountWithMeta | undefined> {
    const docusignKeys = await this.getDocusignSecret();

    const docusignAPI = docusignKeys?.docusign;
    this.apiClient = new docusign.ApiClient({ basePath: docusignAPI.baseUrl, oAuthBasePath: null as any });

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
      const loginAccount = loginAccounts?.[0];
      const baseUrl = loginAccount?.baseUrl || '';
      const accountDomain = baseUrl.split('/v2');
      this.apiClient.setBasePath(accountDomain[0]);
      return (
        loginAccount && {
          ...loginAccount,
          headers: {
            'X-DocuSign-Authentication': `${creds}`,
          },
        }
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async sendTemplate(templateData: IDocusignCompositeContract): Promise<docusign.EnvelopeSummary | null> {
    const account = (await this.createConnection()) as docusign.LoginAccount;

    const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
    let results: EnvelopeSummary;

    try {
      results = await envelopesApi.createEnvelope(account.accountId || '', { envelopeDefinition: templateData });
      return results;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async getDocusignSecret(docusignSecretsName?: string): Promise<IDocusignSecretManager> {
    let secret = '';
    let decodedBinarySecret = '';

    try {
      const data = await this.client
        .getSecretValue({ SecretId: docusignSecretsName || process.env.DOCUSIGN_SECRET_NAME || '' })
        .promise();
      if ('SecretString' in data) {
        secret = data.SecretString || '';
      } else {
        const buff = Buffer.from((data.SecretBinary || '').toString(), 'base64');
        decodedBinarySecret = buff.toString('ascii');
      }
    } catch (error) {
      console.error('>>>>>>>>>>>>>>>>>>>', 'DocusignAPIService -> decode secret error', error);
    }

    return JSON.parse(secret || decodedBinarySecret) as IDocusignSecretManager;
  }

  getEnvelopeDocumentById(envelopeId: string): Promise<IncomingMessage> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line consistent-return
      this.createConnection().then(account => {
        if (!account) return reject(ApplicationException.NoPermission());

        const { headers, baseUrl } = account;

        const url = new URL(baseUrl as string);
        https.get(
          {
            hostname: url.host,
            path: `${url.pathname}/envelopes/${envelopeId}/documents/combined`,
            headers,
          },
          res => {
            if (res.statusCode !== 200) {
              console.log(`No document found with envelopeId=${envelopeId}`);
              return reject(ApplicationException.ServiceError());
            }
            return resolve(res);
          },
        );
      });
    });
  }
}

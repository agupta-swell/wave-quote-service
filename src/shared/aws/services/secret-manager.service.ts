import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { CredentialService } from './credential.service';

@Injectable()
export class SecretManagerService {
  private secretManagerClient: AWS.SecretsManager;

  constructor(private readonly credentialService: CredentialService) {
    this.secretManagerClient = new AWS.SecretsManager(this.credentialService.getCredentials());
  }

  public async getSecret(secretId: string): Promise<string> {
    const res = await this.secretManagerClient.getSecretValue({ SecretId: secretId }).promise();

    if (res.SecretString) {
      return res.SecretString;
    }

    if (res.SecretBinary) {
      return Buffer.from(res.SecretBinary.toString(), 'base64').toString('ascii');
    }

    throw new Error('Invalid secret response');
  }
}

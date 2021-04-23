import * as AWS from 'aws-sdk';
import { Injectable } from '@nestjs/common';
import { IBaseAWSCredentials } from '../interfaces/IBaseCredentials';

@Injectable()
export class CredentialService {
  private _accessKeyId: string;

  private _secretAccessKey: string;

  private _region: string;

  private _sessionToken?: string;

  constructor() {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_SESSION_TOKEN } = process.env;

    this._accessKeyId = AWS_ACCESS_KEY_ID as string;
    this._secretAccessKey = AWS_SECRET_ACCESS_KEY as string;
    this._region = AWS_REGION as string;
    this._sessionToken = AWS_SESSION_TOKEN as string | undefined;

    AWS.config.update(this.getCredentials());
  }

  getCredentials(): IBaseAWSCredentials {
    return {
      accessKeyId: this._accessKeyId,
      secretAccessKey: this._secretAccessKey,
      region: this._region,
      sessionToken: this._sessionToken,
    };
  }
}

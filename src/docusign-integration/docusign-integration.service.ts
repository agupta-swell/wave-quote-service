import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { OperationResult } from 'src/app/common';
import * as docusign from 'docusign-esign';
import { SecretManagerService } from 'src/shared/aws/services/secret-manager.service';
import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { IDocusignAwsSecretPayload } from 'src/shared/docusign/interfaces/IDocusignAwsSecretPayload';
import { ApplicationException } from 'src/app/app.exception';
import { DocusignApiService } from 'src/shared/docusign';
import { DOCUSIGN_INTEGRATION_NAME, SCOPES, JWT_EXPIRES_IN } from './constants';
import { DocusignIntegrationDocument } from './docusign-integration.schema';
import { DocusignIntegrationReqDto } from './req/docusign-integration';
import { DocusignIntegrationResDto } from './res/docusign-integration';

@Injectable()
export class DocusignIntegrationService implements OnModuleInit {
  private apiClient: docusign.ApiClient;

  private readonly secretName: string;

  constructor(
    private readonly secretManagerService: SecretManagerService,
    @InjectModel(DOCUSIGN_INTEGRATION_NAME) private docusignIntegrationModel: Model<DocusignIntegrationDocument>,
    @Inject(forwardRef(() => DocusignApiService))
    private readonly docusignApiService: DocusignApiService<any>,
  ) {
    if (!process.env.DOCUSIGN_SECRET_NAME) {
      throw new Error('Missing DOCUSIGN_SECRET_NAME');
    }

    this.secretName = process.env.DOCUSIGN_SECRET_NAME;
  }

  public async onModuleInit() {
    const secretString = await this.secretManagerService.getSecret(this.secretName);

    const parsedSecret: IDocusignAwsSecretPayload = JSON.parse(secretString);

    this.apiClient = new docusign.ApiClient({
      basePath: parsedSecret.docusign.baseUrl,
      oAuthBasePath: null as any,
    });
  }

  async getOneDocusignIntegration(): Promise<OperationResult<DocusignIntegrationResDto>> {
    const res = await this.findOneDocusignIntegration();

    return OperationResult.ok(strictPlainToClass(DocusignIntegrationResDto, res));
  }

  async findOneDocusignIntegration(): Promise<DocusignIntegrationDocument | null> {
    const res = await this.docusignIntegrationModel.findOne();
    return res;
  }

  async updateAccessToken(
    id: string | ObjectId,
    accessToken: string,
    expiresAt: Date,
  ): Promise<DocusignIntegrationDocument> {
    const res = await this.docusignIntegrationModel.findById(id);

    if (!res) {
      throw ApplicationException.EntityNotFound(`with id ${id} `);
    }
    res.accessToken = accessToken;
    res.expiresAt = expiresAt;

    await this.docusignApiService.updateJwtAuthConfig(res);

    await res.save();

    return res;
  }

  async addDocusignIntegration(data: DocusignIntegrationReqDto): Promise<void> {
    const foundDocusignIntegration = await this.docusignIntegrationModel.findOne();
    if (!foundDocusignIntegration) {
      const newDocusignIntegration = new this.docusignIntegrationModel({
        ...data,
        scopes: SCOPES,
      });

      await newDocusignIntegration.save();
    } else {
      await this.docusignIntegrationModel.findOneAndUpdate(
        { _id: foundDocusignIntegration._id },
        {
          $set: data,
          $unset: {
            expiresAt: '',
            accessToken: '',
          },
        },
      );
    }
  }

  async addDocusignAccessTokenAfterConsent(): Promise<void> {
    const foundDocusignIntegration = await this.docusignIntegrationModel.findOne();
    if (foundDocusignIntegration) {
      const result = await this.apiClient.requestJWTUserToken(
        foundDocusignIntegration.clientId,
        foundDocusignIntegration.userId,
        SCOPES,
        Buffer.from(foundDocusignIntegration.rsaPrivateKey),
        JWT_EXPIRES_IN,
      );
      // The access token granted by JWT Grant expires after one hour,
      // see document: https://developers.docusign.com/platform/auth/jwt/jwt-get-token/,
      // section Token expiration and best practices
      // should get a new access token about 15 minutes before their existing one expires
      await this.updateAccessToken(
        foundDocusignIntegration._id,
        result.body.access_token,
        new Date(Date.now() + (result.body.expires_in - 15 * 60) * 1000),
      );
    }
  }

  async getJWTUri(): Promise<OperationResult<string>> {
    const foundDocusignIntegration = await this.docusignIntegrationModel.findOne();

    if (!foundDocusignIntegration) {
      throw ApplicationException.EntityNotFound(`Docusign Integration not found`);
    }

    const res = this.apiClient.getJWTUri(
      foundDocusignIntegration.clientId,
      foundDocusignIntegration.redirectUri,
      this.apiClient.getOAuthBasePath(),
    );
    return OperationResult.ok(res);
  }
}

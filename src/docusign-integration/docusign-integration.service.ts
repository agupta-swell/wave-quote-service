import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, ObjectId, Types } from 'mongoose';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { OperationResult } from 'src/app/common';
import * as docusign from 'docusign-esign';
import { BadRequestException, forwardRef, HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { IDocusignAwsSecretPayload } from 'src/shared/docusign/interfaces/IDocusignAwsSecretPayload';
import { ApplicationException } from 'src/app/app.exception';
import { DocusignApiService } from 'src/shared/docusign';
import { DocusignException } from 'src/shared/docusign/docusign.exception';
import { DOCUSIGN_INTEGRATION_NAME, SCOPES, JWT_EXPIRES_IN, DOCUSIGN_INTEGRATION_TYPE } from './constants';
import { DocusignIntegrationDocument } from './docusign-integration.schema';
import { DocusignIntegrationReqDto } from './req/docusign-integration';
import { DocusignIntegrationResDto } from './res/docusign-integration';
import { IUpdateAccessToken } from './interfaces';

@Injectable()
export class DocusignIntegrationService implements OnModuleInit {
  private apiClient: docusign.ApiClient;

  private readonly docusignCredentials: IDocusignAwsSecretPayload;

  constructor(
    @InjectModel(DOCUSIGN_INTEGRATION_NAME) private docusignIntegrationModel: Model<DocusignIntegrationDocument>,
    @Inject(forwardRef(() => DocusignApiService))
    private readonly docusignApiService: DocusignApiService<any>,
  ) {
    const docusignCredentialsEnv = process.env.DOCUSIGN_CREDENTIALS;

    if (!docusignCredentialsEnv) {
      throw new Error('Missing DOCUSIGN_CREDENTIALS');
    }

    const docusignSecret: IDocusignAwsSecretPayload = JSON.parse(docusignCredentialsEnv);

    if (!docusignSecret?.docusign?.baseUrl) {
      throw new Error('DOCUSIGN_CREDENTIALS is invalid');
    }

    this.docusignCredentials = docusignSecret;
  }

  public async onModuleInit() {
    this.apiClient = new docusign.ApiClient({
      basePath: this.docusignCredentials.docusign.baseUrl,
      oAuthBasePath: null as any,
    });
  }

  async findOneDocusignIntegrationByType(
    type: DOCUSIGN_INTEGRATION_TYPE,
  ): Promise<LeanDocument<DocusignIntegrationDocument> | DocusignIntegrationDocument | null> {
    const res = await this.docusignIntegrationModel.findOne({ type }).lean();
    return res;
  }

  async updateAccessToken(data: IUpdateAccessToken): Promise<DocusignIntegrationDocument> {
    const { id, accessToken, expiresAt } = data;
    const res = await this.docusignIntegrationModel.findById(id);

    if (!res) {
      throw ApplicationException.EntityNotFound(`with id ${id} `);
    }
    res.accessToken = accessToken;
    res.expiresAt = expiresAt;

    const docusignIntegrationType = res.type || DOCUSIGN_INTEGRATION_TYPE.DEFAULT;

    await this.docusignApiService.updateJwtAuthConfig(res, docusignIntegrationType);

    await res.save();

    return res;
  }

  async addDocusignIntegration(data: DocusignIntegrationReqDto): Promise<void> {
    if (!Object.values(DOCUSIGN_INTEGRATION_TYPE).includes(data.type)) {
      throw ApplicationException.InvalidDocusignIntegrationType();
    }
    const foundDocusignIntegration = await this.docusignIntegrationModel.findOne({ type: data.type });
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

  async addDocusignAccessTokenAfterConsent(type: DOCUSIGN_INTEGRATION_TYPE): Promise<void> {
    try {
      const foundDocusignIntegration = await this.docusignIntegrationModel.findOne({ type });

      if (!foundDocusignIntegration) {
        throw ApplicationException.EntityNotFound(`with type ${type} `);
      }

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
      await this.updateAccessToken({
        id: foundDocusignIntegration._id,
        accessToken: result.body.access_token,
        expiresAt: new Date(Date.now() + (result.body.expires_in - 15 * 60) * 1000),
      });
    } catch (error) {
      throw new DocusignException(
        error,
        Object.assign(error.response?.body || {}, { statusCode: HttpStatus.BAD_REQUEST }),
      );
    }
  }

  async getJWTUri(type: DOCUSIGN_INTEGRATION_TYPE): Promise<OperationResult<string>> {
    const foundDocusignIntegration = await this.docusignIntegrationModel.findOne({ type });

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

  async findAllDocusignIntegration(): Promise<
    DocusignIntegrationDocument[] | LeanDocument<DocusignIntegrationDocument>[]
  > {
    const res = await this.docusignIntegrationModel.find().lean();
    return res;
  }

  async getAllDocusignIntegration(): Promise<OperationResult<DocusignIntegrationResDto[]>> {
    const res = await this.findAllDocusignIntegration();

    return OperationResult.ok(strictPlainToClass(DocusignIntegrationResDto, res));
  }
}

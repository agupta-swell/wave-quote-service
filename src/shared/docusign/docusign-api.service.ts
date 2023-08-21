/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-use-before-define */
/* eslint-disable no-plusplus */
import { Inject, Injectable, OnModuleInit, forwardRef } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as docusign from 'docusign-esign';
import { EnvelopeSummary } from 'docusign-esign';
import { IncomingMessage } from 'http';
import * as https from 'https';
import { cloneDeep } from 'lodash';
import { LeanDocument, ObjectId, Types } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { IContractMetrics } from 'src/contracts/contract.schema';
import { ContractService } from 'src/contracts/contract.service';
import { DOCUSIGN_INTEGRATION_TYPE, JWT_EXPIRES_IN, SCOPES } from 'src/docusign-integration/constants';
import { DocusignIntegrationDocument } from 'src/docusign-integration/docusign-integration.schema';
import { DocusignIntegrationService } from 'src/docusign-integration/docusign-integration.service';
import { MultipartStreamBuilder } from '../multipart-builder';
import { KEYS } from './constants';
import { InjectDocusignContext } from './decorators/inject-docusign-context';
import { docusignMetaStorage } from './decorators/meta-storage';
import { DocusignException } from './docusign.exception';
import { IDocusignContextStore, IRecipient, TResendEnvelopeStatus } from './interfaces';
import { ICompiledTemplate } from './interfaces/ICompiledTemplate';
import { IDefaultContractor } from './interfaces/IDefaultContractor';
import { IDocusignAwsSecretPayload } from './interfaces/IDocusignAwsSecretPayload';
import { IPageNumberFormatter } from './interfaces/IPageNumberFormatter';
import { ISendContractProps } from './typing';

@Injectable()
export class DocusignApiService<Context> implements OnModuleInit {
  private static apiClient: Map<DOCUSIGN_INTEGRATION_TYPE, docusign.ApiClient> = new Map();

  private static envelopeApi: Map<DOCUSIGN_INTEGRATION_TYPE, docusign.EnvelopesApi> = new Map();

  private static accountId: Map<DOCUSIGN_INTEGRATION_TYPE, string> = new Map();

  private readonly docusignCredentials: IDocusignAwsSecretPayload;

  private _defaultContractor: IDefaultContractor;

  private _docusignEmail: string;

  private static _baseUrl: Map<DOCUSIGN_INTEGRATION_TYPE, URL> = new Map();

  private static _headers: Map<DOCUSIGN_INTEGRATION_TYPE, Record<string, string>> = new Map();

  static _jwtAuthConfig: Map<DOCUSIGN_INTEGRATION_TYPE, LeanDocument<DocusignIntegrationDocument>> = new Map();

  constructor(
    @InjectDocusignContext()
    private readonly contextStore: IDocusignContextStore,
    @Inject(KEYS.PAGE_NUMBER_FORMATTER)
    private readonly pageNumberFormatter: IPageNumberFormatter,
    private readonly docusignIntegrationService: DocusignIntegrationService,
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
  ) {
    const docusignCredentialsEnv = process.env.DOCUSIGN_CREDENTIALS;

    if (!docusignCredentialsEnv) {
      throw new Error('Missing DOCUSIGN_CREDENTIALS');
    }

    const docusignSecret: IDocusignAwsSecretPayload = JSON.parse(docusignCredentialsEnv);

    const { baseUrl, defaultContractor, email } = docusignSecret?.docusign || {};

    if (!baseUrl || !defaultContractor || !email) {
      throw new Error('DOCUSIGN_CREDENTIALS is invalid');
    }

    this.docusignCredentials = docusignSecret;
  }

  get defaultContractor(): IDefaultContractor {
    return this._defaultContractor;
  }

  get email(): string {
    return this._docusignEmail;
  }

  public async onModuleInit() {
    this._defaultContractor = this.docusignCredentials.docusign.defaultContractor;

    this._docusignEmail = this.docusignCredentials.docusign.email;

    Object.values(DOCUSIGN_INTEGRATION_TYPE).forEach((docusignIntegrationType: DOCUSIGN_INTEGRATION_TYPE) => {
      DocusignApiService.apiClient.set(
        docusignIntegrationType,
        new docusign.ApiClient({
          basePath: this.docusignCredentials.docusign.baseUrl,
          oAuthBasePath: null as any,
        }),
      );
    });

    await Promise.all(
      Object.values(DOCUSIGN_INTEGRATION_TYPE).map(async (docusignIntegrationType: DOCUSIGN_INTEGRATION_TYPE) => {
        const docusignIntegration = await this.docusignIntegrationService.findOneDocusignIntegrationByType(
          docusignIntegrationType,
        );
        if (docusignIntegration?.accessToken) {
          DocusignApiService._jwtAuthConfig.set(docusignIntegrationType, docusignIntegration);
          try {
            await this.getNewAccessTokenIfExpired(docusignIntegrationType);

            // setAuthConfig on init
            await this.setAuthConfig(docusignIntegrationType);
          } catch (e) {
            console.error('onModuleInit Docusign Integration Error: ', e.message);
          }
        }
      }),
    );
  }

  public async updateJwtAuthConfig(
    newJwtAuthConfig: LeanDocument<DocusignIntegrationDocument>,
    docusignIntegrationType: DOCUSIGN_INTEGRATION_TYPE,
  ): Promise<void> {
    DocusignApiService._jwtAuthConfig.set(docusignIntegrationType, newJwtAuthConfig);
    await this.setAuthConfig(docusignIntegrationType);
  }

  async getNewAccessTokenIfExpired(docusignIntegrationType: DOCUSIGN_INTEGRATION_TYPE): Promise<boolean> {
    const checkTime = new Date().getTime();

    if (checkTime > DocusignApiService._jwtAuthConfig.get(docusignIntegrationType)!.expiresAt.getTime()) {
      const { userId, clientId, rsaPrivateKey } = DocusignApiService._jwtAuthConfig.get(docusignIntegrationType)!;

      try {
        const results = await DocusignApiService.apiClient
          .get(docusignIntegrationType)!
          .requestJWTUserToken(clientId, userId, SCOPES, Buffer.from(rsaPrivateKey), JWT_EXPIRES_IN);

        // The access token granted by JWT Grant expires after one hour,
        // see document: https://developers.docusign.com/platform/auth/jwt/jwt-get-token/,
        // section Token expiration and best practices
        // should get a new access token about 15 minutes before their existing one expires
        const expiresAt = new Date(Date.now() + (results.body.expires_in - 15 * 60) * 1000);

        await this.docusignIntegrationService.updateAccessToken({
          id: DocusignApiService._jwtAuthConfig.get(docusignIntegrationType)!._id,
          accessToken: results.body.access_token,
          expiresAt,
        });

        return true;
      } catch (error) {
        throw new DocusignException(error, error.response?.text);
      }
    }

    return false;
  }

  async setAuthConfig(docusignIntegrationType: DOCUSIGN_INTEGRATION_TYPE): Promise<void> {
    try {
      DocusignApiService.apiClient
        .get(docusignIntegrationType)!
        .addDefaultHeader(
          'Authorization',
          `Bearer ${DocusignApiService._jwtAuthConfig.get(docusignIntegrationType)!.accessToken}`,
        );
      // get user info
      const userInfo = await DocusignApiService.apiClient
        .get(docusignIntegrationType)!
        .getUserInfo(DocusignApiService._jwtAuthConfig.get(docusignIntegrationType)!.accessToken);

      const { accounts } = userInfo;

      let docusignAccount;
      const defaultAccount = accounts?.find(account => account.isDefault === 'true');

      if (docusignIntegrationType === DOCUSIGN_INTEGRATION_TYPE.ESA) {
        const ESAAccount = accounts?.find(account => account.accountId === process.env.DOCUSIGN_ESA_ACCOUNT_ID);
        docusignAccount = ESAAccount || defaultAccount;
      } else {
        docusignAccount = defaultAccount;
      }

      if (!docusignAccount) {
        throw new Error('Could not login into docusign');
      }

      DocusignApiService.accountId.set(docusignIntegrationType, docusignAccount.accountId);

      const baseUrl = docusignAccount.baseUri;

      DocusignApiService._baseUrl.set(
        docusignIntegrationType,
        new URL(`${baseUrl}/restapi/v2.1/accounts/${DocusignApiService.accountId.get(docusignIntegrationType)!}`),
      );

      DocusignApiService.apiClient.get(docusignIntegrationType)!.setBasePath(`${baseUrl}/restapi`);

      DocusignApiService.envelopeApi.set(
        docusignIntegrationType,
        new docusign.EnvelopesApi(DocusignApiService.apiClient.get(docusignIntegrationType)!),
      );

      DocusignApiService._headers.set(docusignIntegrationType, {
        Authorization: `Bearer ${DocusignApiService._jwtAuthConfig.get(docusignIntegrationType)!.accessToken}`,
      });
    } catch (error) {
      throw new DocusignException(error, error.response?.text);
    }
  }

  public async sendContract({
    contractId,
    pageFrom,
    isDraft = false,
    createContractPayload,
  }: ISendContractProps): Promise<EnvelopeSummary> {
    const context = this.contextStore.get<Context>();

    const docusignIntegrationType = context.docusignIntegrationType || DOCUSIGN_INTEGRATION_TYPE.DEFAULT;

    createContractPayload.compositeTemplates.forEach(e => {
      e.serverTemplates.forEach(e => context.serverTemplateIds.push(e.templateId));
    });

    createContractPayload.compositeTemplates.forEach(template => {
      template.inlineTemplates.forEach(inline => {
        inline.recipients.signers.forEach(recipient => {
          recipient.tabs = {
            textTabs: this.buildTextTab(recipient.templateId) as any,
          };
        });
      });
    });

    const envelope: Record<string, any> = {
      envelopeDefinition: {
        ...createContractPayload,
        status: 'created',
        // According to the documentation, `authoritativeCopy` value should be set to `null`
        // in order for Docusign to use the account default Authoritative Copy (AC) setting,
        // but as of now, there is no final decision on AC Setting for ESA Account vs for Default Account,
        // so this value will be temporarily set to `false`.
        //
        // Ref: https://developers.docusign.com/docs/esign-rest-api/esign101/concepts/documents/authoritative-copies/
        authoritativeCopy: docusignIntegrationType === DOCUSIGN_INTEGRATION_TYPE.ESA ? false : null,
      },
      mergeRolesOnDraft: true,
      changeRoutingOrder: true,
    };

    try {
      const result = await DocusignApiService.envelopeApi
        .get(docusignIntegrationType)!
        .createEnvelope(DocusignApiService.accountId.get(docusignIntegrationType)!, envelope);

      if (!result.envelopeId) return result;

      context.envelopeId = result.envelopeId;

      if (pageFrom) {
        await this.populatePageNumber(pageFrom);
      }

      if (context.docWithPrefillTabIds.length) {
        const contractMetrics = await this.updatePrefillTabs(result.envelopeId, contractId);
        if (docusignIntegrationType === DOCUSIGN_INTEGRATION_TYPE.ESA) {
          await this.contractService.saveContractMetrics(contractId, contractMetrics);
        }
      }

      if (!isDraft) {
        await this.sendDraftEnvelop(result.envelopeId);
      }

      return result;
    } catch (error) {
      if (error instanceof DocusignException) throw error;

      throw new DocusignException(error, error.response?.text);
    }
  }

  public useContext(value: Context): this {
    const curCtx = this.contextStore.get<Context>();

    curCtx.genericObject = value;

    return this;
  }

  public async preCheckValidAuthConfig(docusignIntegrationType: DOCUSIGN_INTEGRATION_TYPE) {
    const curCtx = this.contextStore.get<Context>();

    curCtx.docusignIntegrationType = docusignIntegrationType;

    let isInitAuthConfig = false;
    if (!DocusignApiService._jwtAuthConfig.get(docusignIntegrationType)?.accessToken) {
      const docusignIntegration = await this.docusignIntegrationService.findOneDocusignIntegrationByType(
        docusignIntegrationType,
      );

      if (!docusignIntegration?.accessToken) {
        throw ApplicationException.InvalidDocusignIntegrationConfig(docusignIntegrationType);
      }
      DocusignApiService._jwtAuthConfig.set(docusignIntegrationType, docusignIntegration);
      isInitAuthConfig = true;
    }
    await this.getNewAccessTokenIfExpired(docusignIntegrationType);

    if (isInitAuthConfig) await this.setAuthConfig(docusignIntegrationType);
  }

  public getEnvelopeDocumentById(envelopeId: string, showChanges: boolean): Promise<IncomingMessage> {
    const context = this.contextStore.get<Context>();

    const docusignIntegrationType = context.docusignIntegrationType || DOCUSIGN_INTEGRATION_TYPE.DEFAULT;

    return new Promise((resolve, reject) => {
      https.get(
        {
          hostname: DocusignApiService._baseUrl.get(docusignIntegrationType)!.host,
          path: `${
            DocusignApiService._baseUrl.get(docusignIntegrationType)!.pathname
          }/envelopes/${envelopeId}/documents/combined?show_changes=${showChanges}`,
          headers: DocusignApiService._headers.get(docusignIntegrationType)!,
        },
        res => {
          if (res.statusCode !== 200) {
            console.error(`No document found with envelopeId=${envelopeId}`);
            return reject(ApplicationException.ServiceError());
          }
          return resolve(res);
        },
      );
    });
  }

  public sendDraftEnvelop(envelopeId: string): Promise<any> {
    return this.updateEnvelope(envelopeId, { status: 'sent' }, 'Send contract from draft');
  }

  public async resendEnvelop(envelopeId: string): Promise<TResendEnvelopeStatus> {
    try {
      const context = this.contextStore.get<Context>();

      const docusignIntegrationType = context.docusignIntegrationType || DOCUSIGN_INTEGRATION_TYPE.DEFAULT;

      const res = await DocusignApiService.envelopeApi
        .get(docusignIntegrationType)!
        .update(DocusignApiService.accountId.get(docusignIntegrationType)!, envelopeId, {
          resendEnvelope: true,
        });

      if (res.errorDetails) {
        return {
          status: false,
          message: res.errorDetails.message!,
        };
      }

      return { status: true };
    } catch (error) {
      console.error(
        '🚀 ~ file: docusign-api.service.ts ~ line 143 ~ DocusignAPIService ~ resendEnvelop ~ error',
        error,
      );
      throw new DocusignException(error, error.response?.text);
    }
  }

  public sendWetSignedContract(
    document: NodeJS.ReadableStream,
    originFilename: string,
    ext: string,
    mime: string,
    emailSubject: string,
    recipient: IRecipient,
    carbonCopyRecipients?: IRecipient[],
  ): Promise<EnvelopeSummary> {
    return new Promise((resolve, reject) => {
      const context = this.contextStore.get<Context>();

      const docusignIntegrationType = context.docusignIntegrationType || DOCUSIGN_INTEGRATION_TYPE.DEFAULT;
      let filename = `${encodeURIComponent(originFilename)}_${+Date.now()}_${randomBytes(4).toString('hex')}`;
      if(filename.length >= 100){
        filename = `${encodeURIComponent(originFilename.slice(0,40))}_${+Date.now()}_${randomBytes(4).toString('hex')}`;
      }
      const payload = {
        emailSubject,
        documents: [
          {
            name: filename,
            fileExtension: ext,
            documentId: '1',
          },
        ],
        recipients: {
          signers: [
            {
              ...recipient,
              routingOrder: '1',
              recipientId: '1',
            },
          ],
          carbonCopies: carbonCopyRecipients?.map((r, idx) => ({
            ...r,
            routingOrder: `${2 + idx}`,
            recipientId: `${2 + idx}`,
          })),
        },
        status: 'sent',
        emailBlurb: 'Please review and sign the contract for your energy project!',
      };

      const multipartStream = new MultipartStreamBuilder<any>(document, payload, {
        mime,
        filename,
        documentid: '1',
      });

      const req = https.request(
        {
          hostname: DocusignApiService._baseUrl.get(docusignIntegrationType)!.host,
          path: `${DocusignApiService._baseUrl.get(docusignIntegrationType)!.pathname}/envelopes`,
          headers: {
            ...DocusignApiService._headers.get(docusignIntegrationType)!,
            'Content-Type': multipartStream.getType(),
          },
          method: 'post',
        },
        res => {
          const chunks: Buffer[] = [];

          res
            .on('data', chunk => {
              chunks.push(chunk);
            })
            .on('end', () => {
              const payload = Buffer.concat(chunks).toString('utf-8');

              if (res.statusCode! >= 300) {
                reject(new DocusignException(new Error(payload), 'Send Contract from Wet Sign Document failed'));
                return;
              }

              resolve(JSON.parse(payload));
            });
        },
      );

      multipartStream.pipe(req);
    });
  }

  private async updatePrefillTabs(envelopeId: string, contractId: string): Promise<IContractMetrics[]> {
    const context = this.contextStore.get<Context>();

    if (!context.genericObject) {
      throw new Error('Missing docusign context generic object');
    }

    const foundContract = await this.contractService.getOneByContractId(
      (Types.ObjectId(contractId) as unknown) as ObjectId,
    );

    const contractMetrics: IContractMetrics[] = [];
    const { docWithPrefillTabIds, templateIds } = context;

    /**
     * Must run in for-loop due to docusign lock mechanism
     */
    // eslint-disable-next-line no-plusplus
    for (let idx = 0; idx < docWithPrefillTabIds.length; idx++) {
      const docId = docWithPrefillTabIds[idx];
      const templateId = templateIds[idx];

      // eslint-disable-next-line no-await-in-loop
      const docusignTabs = await this.getDocumentTabs(envelopeId, `${docId}`);

      if (docusignTabs?.prefillTabs?.textTabs) {
        const textTabs = cloneDeep(docusignTabs?.prefillTabs?.textTabs);
        docusignTabs.prefillTabs.textTabs = textTabs.sort((a, b) => a.tabLabel!.localeCompare(b.tabLabel!));
      }

      const foundTemplate = docusignMetaStorage.find(e => e.ids.includes(templateId));
      if (!foundTemplate) {
        throw new DocusignException(undefined, `No template found with id ${templateIds[idx]}`);
      }

      const prefillTabs = foundTemplate.toPrefillTabs(
        context.genericObject,
        this._defaultContractor,
        docusignTabs,
        templateId,
      );

      // eslint-disable-next-line no-continue
      if (!prefillTabs || !prefillTabs.prefillTabs.textTabs.length) continue;

      if (context.docusignIntegrationType === DOCUSIGN_INTEGRATION_TYPE.ESA) {
        const foundContractTemplate = foundContract.contractTemplateDetail.templateDetails.find(
          item => item.docusignTemplateId === templateId,
        );

        if (!foundContractTemplate) {
          throw new DocusignException(undefined, `No template found with id ${templateIds[idx]}`);
        }

        const templateFields: Record<string, string> = {};
        prefillTabs.prefillTabs.textTabs.forEach(item => {
          if (item.tabLabel) {
            templateFields[item.tabLabel] = item.value === undefined ? '' : item.value;
          }
        });

        contractMetrics.push({
          templateId: foundContractTemplate.id,
          templateName: foundContractTemplate.templateName,
          templateFields,
        });
      }

      // eslint-disable-next-line no-await-in-loop
      await this.populatePrefillTabs(envelopeId, `${docId}`, prefillTabs);
    }

    return contractMetrics;
  }

  private buildTextTab(templateId: string): ICompiledTemplate.TextTab[] {
    const ctx = this.contextStore.get<Context>();
    const textTabs = ctx.compiledTemplates[templateId]?.textTabs;

    if (textTabs) return textTabs;

    const foundTemplate = docusignMetaStorage.find(e => e.ids.includes(templateId));

    if (!foundTemplate) {
      throw new DocusignException(undefined, `No template found with id ${templateId}`);
    }

    ctx.buildTime += 1;

    if (foundTemplate.hasPrefillTab) {
      ctx.docWithPrefillTabIds.push(ctx.buildTime);
      ctx.templateIds.push(templateId);
    }

    try {
      const tabs = foundTemplate.toTextTabs(ctx.genericObject, this._defaultContractor, templateId);

      ctx.compiledTemplates[templateId] = {
        textTabs: tabs,
      };

      return tabs;
    } catch (error) {
      throw new DocusignException(error, `Build text tabs failed at template ${templateId}`);
    }
  }

  private getDocumentTabs(envelopeId: string, docId: string): Promise<ICompiledTemplate.DocTabs> {
    return new Promise((resolve, reject) => {
      const context = this.contextStore.get<Context>();

      const docusignIntegrationType = context.docusignIntegrationType || DOCUSIGN_INTEGRATION_TYPE.DEFAULT;

      https.get(
        {
          hostname: DocusignApiService._baseUrl.get(docusignIntegrationType)!.host,
          path: `${
            DocusignApiService._baseUrl.get(docusignIntegrationType)!.pathname
          }/envelopes/${envelopeId}/documents/${docId}/tabs`,
          headers: DocusignApiService._headers.get(docusignIntegrationType)!,
        },
        res => {
          const chunks: Buffer[] = [];

          if (res.statusCode !== 200) {
            reject(
              new DocusignException(
                undefined,
                `Can not get document tabs from envelopeId ${envelopeId}, docId ${docId}`,
              ),
            );
            res.destroy();
            return;
          }

          res
            .on('data', chunk => {
              chunks.push(chunk);
            })
            .on('end', () => {
              resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
            })
            .on('error', err => {
              reject(new DocusignException(err, 'Docusign get tabs by document api error'));
            });
        },
      );
    });
  }

  public async voidEnvelope(envelopeId: string): Promise<docusign.EnvelopeUpdateSummary> {
    const result = await this.updateEnvelope(
      envelopeId,
      { status: 'voided', voidedReason: 'Agent cancelled' },
      'Void contract',
    );
    return result;
  }

  private populatePrefillTabs(
    envelopeId: string,
    docId: string,
    value: any,
    mode: 'update' | 'create' = 'update',
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const context = this.contextStore.get<Context>();

      const docusignIntegrationType = context.docusignIntegrationType || DOCUSIGN_INTEGRATION_TYPE.DEFAULT;

      https
        .request(
          {
            hostname: DocusignApiService._baseUrl.get(docusignIntegrationType)!.host,
            path: `${
              DocusignApiService._baseUrl.get(docusignIntegrationType)!.pathname
            }/envelopes/${envelopeId}/documents/${docId}/tabs`,
            headers: DocusignApiService._headers.get(docusignIntegrationType)!,
            method: mode === 'update' ? 'put' : 'post',
          },
          res => {
            if (res.statusCode === 200 || res.statusCode === 201) {
              resolve();

              res.destroy();
              return;
            }

            const chunks: Buffer[] = [];

            res
              .on('data', c => {
                chunks.push(c);
              })
              .on('end', () => {
                const errorPayload = Buffer.concat(chunks).toString('utf-8');
                console.error(
                  '🚀 ~ file: docusign-api.service.ts ~ line 340 ~ DocusignApiService<Context> ~ .on ~ errorPayload',
                  mode,
                  errorPayload,
                );

                reject(
                  new DocusignException(
                    new Error(errorPayload),
                    `Cannot ${mode} prefill tabs for envelope ${envelopeId} - document ${docId}`,
                  ),
                );
              })
              .on('error', e => {
                reject(new DocusignException(e, `Docusign ${mode} doc tab api error`));
              });
          },
        )
        .end(JSON.stringify(value));
    });
  }

  private async populatePageNumber(pageFrom: string): Promise<void> {
    const ctx = this.contextStore.get<Context>();

    if (!ctx.serverTemplateIds.length || !ctx.envelopeId) return;

    const templatesWithPageNumber: ICompiledTemplate<unknown, Context>[] = [];

    const startIdx = ctx.serverTemplateIds.findIndex(e => e === pageFrom);

    if (startIdx === -1) return;

    const templateIds = ctx.serverTemplateIds.slice(startIdx);

    /**
     * Must call create tabs one by one due to docusign envelope lock mechanism
     */
    for (let i = 0; i < templateIds.length; i++) {
      const templateId = templateIds[i];
      const template = docusignMetaStorage.find(e => e.ids.includes(templateId));

      if (!template) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (template.requirePageNumber) {
        // eslint-disable-next-line no-await-in-loop
        const totalPage = await this.getTemplatePagesCount(templateId);

        template.totalPage = totalPage;
      }

      if (template.totalPage) {
        templatesWithPageNumber.push(template);
      }
    }

    ctx.totalPage = templatesWithPageNumber.reduce((acc, cur) => acc + cur.totalPage, 0);

    for (let i = 0; i < templatesWithPageNumber.length; i++) {
      const docId = ctx.serverTemplateIds.findIndex(e => templatesWithPageNumber[i].ids.includes(e)) + 1;

      const template = templatesWithPageNumber[i];
      const pageNumberTabs = template.toPageNumberTabs(ctx, `${docId}`, this.pageNumberFormatter);

      // eslint-disable-next-line no-await-in-loop
      await this.populatePrefillTabs(ctx.envelopeId, `${docId}`, pageNumberTabs, 'create');
    }
  }

  private async getTemplatePagesCount(templateId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ctx = this.contextStore.get<Context>();

      const docusignIntegrationType = ctx.docusignIntegrationType || DOCUSIGN_INTEGRATION_TYPE.DEFAULT;

      const { envelopeId } = ctx;

      if (!envelopeId) {
        reject(
          new DocusignException(
            new Error('Missing envelopeId'),
            'Unexpected call get template documents in non-allowed context',
          ),
        );
      }

      const templateIdx = ctx.serverTemplateIds.findIndex(e => e === templateId);

      const docId = `${templateIdx + 1}`;

      if (ctx.templatePages) {
        resolve(ctx.templatePages[templateIdx]);
        return;
      }

      https.get(
        {
          hostname: DocusignApiService._baseUrl.get(docusignIntegrationType)!.host,
          path: `${
            DocusignApiService._baseUrl.get(docusignIntegrationType)!.pathname
          }/envelopes/${envelopeId}/documents`,
          headers: DocusignApiService._headers.get(docusignIntegrationType)!,
        },
        res => {
          if (res.statusCode !== 200) {
            res.destroy();

            reject(new DocusignException(undefined, `No envelope found with id ${envelopeId}`));

            return;
          }

          const chunks: Buffer[] = [];

          res
            .on('data', chunk => {
              chunks.push(chunk);
            })
            .on('error', e => {
              reject(new DocusignException(e));
            })
            .on('end', () => {
              const payload = Buffer.concat(chunks).toString('utf-8');

              const json = JSON.parse(payload);

              ctx.templatePages = json?.envelopeDocuments?.map((e: any) => e.pages?.length ?? 0) ?? [];

              resolve(json.envelopeDocuments.find((e: any) => e.documentId === docId).pages.length);
            });
        },
      );
    });
  }

  private updateEnvelope(envelopeId: string, payload: Record<string, unknown>, errorTitle: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const context = this.contextStore.get<Context>();

      const docusignIntegrationType = context.docusignIntegrationType || DOCUSIGN_INTEGRATION_TYPE.DEFAULT;

      https
        .request(
          {
            hostname: DocusignApiService._baseUrl.get(docusignIntegrationType)!.host,
            path: `${DocusignApiService._baseUrl.get(docusignIntegrationType)!.pathname}/envelopes/${envelopeId}`,
            headers: DocusignApiService._headers.get(docusignIntegrationType)!,
            method: 'put',
          },
          res => {
            const chunks: Buffer[] = [];

            res
              .on('data', chunk => {
                chunks.push(chunk);
              })
              .on('end', () => {
                const payload = Buffer.concat(chunks).toString('utf-8');

                if (res.statusCode! >= 300) {
                  reject(new DocusignException(new Error(payload), `${errorTitle} error`));
                  return;
                }

                resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
              });
          },
        )
        .end(JSON.stringify(payload));
    });
  }
}

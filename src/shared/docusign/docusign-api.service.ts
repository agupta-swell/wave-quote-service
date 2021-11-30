/* eslint-disable no-plusplus */
import * as https from 'https';
import { IncomingMessage } from 'http';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import * as docusign from 'docusign-esign';
import { IDocusignCompositeContract } from 'src/docusign-communications/typing';
import { ApplicationException } from 'src/app/app.exception';
import { randomBytes } from 'crypto';
import { EnvelopeSummary } from 'docusign-esign';
import { SecretManagerService } from '../aws/services/secret-manager.service';
import { InjectDocusignContext } from './decorators/inject-docusign-context';
import { docusignMetaStorage } from './decorators/meta-storage';
import { ICompiledTemplate } from './interfaces/ICompiledTemplate';
import { IDocusignContextStore, IRecipient, TResendEnvelopeStatus } from './interfaces';
import { ILoginAccountWithMeta } from './interfaces/ILoginAccountWithMeta';
import { DocusignException } from './docusign.exception';
import { IDefaultContractor } from './interfaces/IDefaultContractor';
import { IPageNumberFormatter } from './interfaces/IPageNumberFormatter';
import { IDocusignAwsSecretPayload } from './interfaces/IDocusignAwsSecretPayload';
import { MultipartStreamBuilder } from '../multipart-builder';
import { KEYS } from './constants';

@Injectable()
export class DocusignApiService<Context> implements OnModuleInit {
  private apiClient: docusign.ApiClient;

  private authApi: docusign.AuthenticationApi;

  private envelopeApi: docusign.EnvelopesApi;

  private accountId: string;

  private readonly secretName: string;

  private _creds: string;

  private _defaultContractor: IDefaultContractor;

  private _docusignEmail: string;

  private _baseUrl: URL;

  private _headers: Record<string, string>;

  constructor(
    private readonly secretManagerService: SecretManagerService,
    @InjectDocusignContext()
    private readonly contextStore: IDocusignContextStore,
    @Inject(KEYS.PAGE_NUMBER_FORMATTER)
    private readonly pageNumberFormatter: IPageNumberFormatter,
  ) {
    if (!process.env.DOCUSIGN_SECRET_NAME) {
      throw new Error('Missing DOCUSIGN_SECRET_NAME');
    }

    this.secretName = process.env.DOCUSIGN_SECRET_NAME;
  }

  get defaultContractor(): IDefaultContractor {
    return this._defaultContractor;
  }

  get email(): string {
    return this._docusignEmail;
  }

  public async onModuleInit() {
    const secretString = await this.secretManagerService.getSecret(this.secretName);

    const parsedSecret: IDocusignAwsSecretPayload = JSON.parse(secretString);

    this._defaultContractor = parsedSecret.docusign.defaultContractor;

    this._docusignEmail = parsedSecret.docusign.email;

    this.apiClient = new docusign.ApiClient({
      basePath: parsedSecret.docusign.baseUrl,
      oAuthBasePath: null as any,
    });

    const creds = JSON.stringify({
      Username: parsedSecret.docusign.email,
      Password: parsedSecret.docusign.password,
      IntegratorKey: parsedSecret.docusign.integratorKey,
    });

    this._creds = creds;

    this.apiClient.addDefaultHeader('X-DocuSign-Authentication', creds);

    await this.initAuth();
  }

  public async sendContract(
    createContractPayload: IDocusignCompositeContract,
    pageFrom: string,
    isDraft = false,
  ): Promise<EnvelopeSummary> {
    const context = this.contextStore.get<Context>();

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
      },
    };

    envelope.mergeRolesOnDraft = true;

    try {
      const result = await this.envelopeApi.createEnvelope(this.accountId, envelope);

      if (!result.envelopeId) return result;

      context.envelopeId = result.envelopeId;

      if (pageFrom) {
        await this.populatePageNumber(pageFrom);
      }

      if (context.docWithPrefillTabIds.length) {
        await this.updatePrefillTabs(result.envelopeId);
      }

      if (!isDraft) {
        await this.sendDraftEnvelop(result.envelopeId);
      }

      return result;
    } catch (error) {
      throw new DocusignException(error, error.response?.text);
    }
  }

  public useContext(value: Context): this {
    const curCtx = this.contextStore.get<Context>();

    curCtx.genericObject = value;

    return this;
  }

  public getEnvelopeDocumentById(envelopeId: string, showChanges: boolean): Promise<IncomingMessage> {
    return new Promise((resolve, reject) => {
      https.get(
        {
          hostname: this._baseUrl.host,
          path: `${this._baseUrl.pathname}/envelopes/${envelopeId}/documents/combined?show_changes=${showChanges}`,
          headers: this._headers,
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

  public async resendEnvelop(envelopedId: string): Promise<TResendEnvelopeStatus> {
    try {
      const res = await this.envelopeApi.update(this.accountId, envelopedId, {
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
      const filename = `${encodeURIComponent(originFilename)}_${+Date.now()}_${randomBytes(4).toString('hex')}`;
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
          hostname: this._baseUrl.host,
          path: `${this._baseUrl.pathname}/envelopes`,
          headers: {
            ...this._headers,
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

  private async updatePrefillTabs(envelopeId: string): Promise<void> {
    const context = this.contextStore.get<Context>();

    if (!context.genericObject) {
      throw new Error('Missing docusign context generic object');
    }

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

      const foundTemplate = docusignMetaStorage.find(e => e.id === templateId);
      if (!foundTemplate) {
        throw new DocusignException(undefined, `No template found with id ${templateIds[idx]}`);
      }

      const prefillTabs = foundTemplate.toPrefillTabs(context.genericObject, this._defaultContractor, docusignTabs);

      // eslint-disable-next-line no-continue
      if (!prefillTabs || !prefillTabs.prefillTabs.textTabs.length) continue;

      // eslint-disable-next-line no-await-in-loop
      await this.populatePrefillTabs(envelopeId, `${docId}`, prefillTabs);
    }
  }

  private buildTextTab(templateId: string): ICompiledTemplate.TextTab[] {
    const ctx = this.contextStore.get<Context>();
    const textTabs = ctx.compiledTemplates[templateId]?.textTabs;

    if (textTabs) return textTabs;

    const foundTemplate = docusignMetaStorage.find(e => e.id === templateId);

    if (!foundTemplate) {
      throw new DocusignException(undefined, `No template found with id ${templateId}`);
    }

    ctx.buildTime += 1;

    if (foundTemplate.hasPrefillTab) {
      ctx.docWithPrefillTabIds.push(ctx.buildTime);
      ctx.templateIds.push(templateId);
    }

    try {
      const tabs = foundTemplate.toTextTabs(ctx, this._defaultContractor);

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
      https.get(
        {
          hostname: this._baseUrl.host,
          path: `${this._baseUrl.pathname}/envelopes/${envelopeId}/documents/${docId}/tabs`,
          headers: this._headers,
        },
        res => {
          const chunks: Buffer[] = [];

          if (res.statusCode !== 200) {
            reject(
              new DocusignException(
                undefined,
                `Can not get document tabs fro envelopeId ${envelopeId}, docId ${docId}`,
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
      https
        .request(
          {
            hostname: this._baseUrl.host,
            path: `${this._baseUrl.pathname}/envelopes/${envelopeId}/documents/${docId}/tabs`,
            headers: this._headers,
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

  private async initAuth(): Promise<ILoginAccountWithMeta> {
    this.authApi = new docusign.AuthenticationApi(this.apiClient);

    const res = await this.authApi.login({ apiPassword: 'true', includeAccountIdGuid: 'true' });

    const { loginAccounts } = res;

    if (!loginAccounts || !loginAccounts.length) {
      throw new Error('Could not login into docusign');
    }

    const loginAccount = loginAccounts[0];

    this.accountId = loginAccount.accountId || '';

    const baseUrl = loginAccount.baseUrl || '';

    this._baseUrl = new URL(baseUrl);

    const accountDomain = baseUrl.split('/v2');

    this.apiClient.setBasePath(accountDomain[0]);

    this.envelopeApi = new docusign.EnvelopesApi(this.apiClient);

    this._headers = {
      'X-DocuSign-Authentication': this._creds,
    };

    return (
      loginAccount && {
        ...loginAccount,
        headers: this._headers,
      }
    );
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
      const template = docusignMetaStorage.find(e => e.id === templateId);

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
      const docId = ctx.serverTemplateIds.findIndex(e => e === templatesWithPageNumber[i].id) + 1;

      const template = templatesWithPageNumber[i];
      const pageNumberTabs = template.toPageNumberTabs(ctx, `${docId}`, this.pageNumberFormatter);

      // eslint-disable-next-line no-await-in-loop
      await this.populatePrefillTabs(ctx.envelopeId, `${docId}`, pageNumberTabs, 'create');
    }
  }

  private async getTemplatePagesCount(templateId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ctx = this.contextStore.get<Context>();

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
          hostname: this._baseUrl.host,
          path: `${this._baseUrl.pathname}/envelopes/${envelopeId}/documents`,
          headers: this._headers,
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
      https
        .request(
          {
            hostname: this._baseUrl.host,
            path: `${this._baseUrl.pathname}/envelopes/${envelopeId}`,
            headers: this._headers,
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

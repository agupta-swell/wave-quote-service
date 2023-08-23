import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { ContractService } from 'src/contracts/contract.service';
import { IncomingMessage } from 'http';
import { DocusignTemplateMaster } from 'src/docusign-templates-master/docusign-template-master.schema';
import { SignerRoleMaster } from 'src/docusign-templates-master/schemas';
import { SignerDetailDto } from 'src/contracts/req/sub-dto/signer-detail.dto';
import { compareIds, transformToValidId } from 'src/utils/common';
import { DocusignApiService, TResendEnvelopeStatus } from 'src/shared/docusign';
import { EnvelopeSummary, EnvelopeUpdateSummary } from 'docusign-esign';
import { FINANCE_PRODUCT_TYPE } from 'src/quotes/constants';
import { DOCUSIGN_INTEGRATION_TYPE } from 'src/docusign-integration/constants';
import {
  ICompositeTemplate,
  IGenericObject,
  IGenericObjectForGSP,
  IInlineTemplate,
  ISendDocusignToContractResponse,
  IServerTemplate,
  ISignerData,
  REQUEST_TYPE,
} from './typing';
import { DocusignCommunication, DOCUSIGN_COMMUNICATION } from './docusign-communication.schema';
import { ISignerDetailDataSchema, ITemplateDetailSchema } from '../contracts/contract.schema';
import { FastifyFile } from '../shared/fastify';
import { getFunctionParams } from './utils';
import { DEFAULT_QUERY_CONTRACT_KEY_MAPPING, DOCUSIGN_API_TYPE } from './constants';

function GetDocusignIntegrationInstance(
  docusignApiType = DOCUSIGN_API_TYPE.DEFAULT,
  customMapping?: Record<string, any>,
): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const queryContractKeyMapping = customMapping || DEFAULT_QUERY_CONTRACT_KEY_MAPPING;
      let queryKey = '';
      let queryValue: any;
      let docusignIntegrationType = DOCUSIGN_INTEGRATION_TYPE.DEFAULT;

      // case originalMethod = ({a,b,c,...}) => {...}
      for (let argIdx = 0; argIdx < args.length; argIdx += 1) {
        const arg = args[argIdx];
        let isDone = false;

        if (typeof arg === 'object') {
          for (let keyIdx = 0; keyIdx < Object.keys(queryContractKeyMapping).length; keyIdx += 1) {
            const key = queryContractKeyMapping[keyIdx];

            if (arg[key]) {
              queryKey = queryContractKeyMapping[key];
              queryValue = arg[key];
              isDone = true;
              break;
            }
          }
        }

        if (isDone === true) {
          break;
        }
      }

      // case originalMethod = (a,b,c,...) => {...}
      if (!queryKey) {
        const params = getFunctionParams(originalMethod);

        for (let paramIdx = 0; paramIdx < params.length; paramIdx += 1) {
          const param = params[paramIdx];
          if (Object.keys(queryContractKeyMapping).includes(param)) {
            queryKey = queryContractKeyMapping[param];
            queryValue = args[paramIdx];
          }
        }
      }

      if (queryKey === '_id') {
        queryValue = transformToValidId(queryValue);
      }

      if (queryKey) {
        const financialProductType = await this.contractService.getFinancialProductType({
          [queryKey]: queryValue,
        });
        docusignIntegrationType =
          financialProductType === FINANCE_PRODUCT_TYPE.ESA
            ? DOCUSIGN_INTEGRATION_TYPE.ESA
            : DOCUSIGN_INTEGRATION_TYPE.DEFAULT;
      }

      switch (docusignApiType) {
        case DOCUSIGN_API_TYPE.GSP:
          await this.docusignGSPApiService.preCheckValidAuthConfig(docusignIntegrationType);
          break;
        default:
          await this.docusignApiService.preCheckValidAuthConfig(docusignIntegrationType);
      }

      const result = originalMethod.apply(this, args);

      return result;
    };

    return descriptor;
  };
}

@Injectable()
export class DocusignCommunicationService {
  // contractService is being used in GetDocusignIntegrationInstance decorator, don't remove it in constructor
  constructor(
    @InjectModel(DOCUSIGN_COMMUNICATION) private readonly docusignCommunicationModel: Model<DocusignCommunication>,
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
    private readonly docusignApiService: DocusignApiService<IGenericObject>,
    private readonly docusignGSPApiService: DocusignApiService<IGenericObjectForGSP>,
  ) {}

  // =====================> INTERNAL <=====================
  @GetDocusignIntegrationInstance(DOCUSIGN_API_TYPE.DEFAULT)
  async sendContractToDocusign(
    contractId: string,
    templateDetails: ITemplateDetailSchema[],
    signerDetails: ISignerDetailDataSchema[],
    genericObject: IGenericObject,
    pageFromTemplateId: string,
    isDraft = false,
  ): Promise<ISendDocusignToContractResponse> {
    if (!genericObject.contract?.name) {
      return { status: 'FAILURE' };
    }

    const docusignPayload: any = {
      emailSubject: this.contractService.getSlicedContractName(false, genericObject.contact.firstName, genericObject.contact.lastName, genericObject.contract.name),
      emailBlurb: 'Please review and sign the contract for your energy project!',
      compositeTemplates: [],
    };

    const maxSignerRoutingOrders = this.getMaxSignerRoutingOrders(templateDetails);

    templateDetails.map(template => {
      const compositeTemplateDataPayload = this.getCompositeTemplatePayloadData(
        template,
        signerDetails,
        maxSignerRoutingOrders,
      );
      docusignPayload.compositeTemplates.push(compositeTemplateDataPayload);
    });

    const resDocusign = await this.docusignApiService
      .useContext(genericObject)
      .sendContract(
        docusignPayload,
        templateDetails.find(e => e.id === pageFromTemplateId)?.docusignTemplateId ?? '',
        isDraft,
      );

    const model = new this.docusignCommunicationModel({
      dateTime: new Date(),
      contractId: isDraft ? undefined : contractId,
      requestType: REQUEST_TYPE.OUTBOUND,
      docusignAccountDetail: { accountName: 'docusign', accountReferenceId: this.docusignApiService.email },
      payloadFromDocusign: JSON.stringify(resDocusign),
      envelopId: resDocusign?.envelopeId,
      proposalId: isDraft ? contractId : undefined,
    });

    await model.save();

    if (resDocusign?.errorDetails?.errorCode) {
      return { status: 'FAILURE' };
    }

    return { status: 'SUCCESS', contractingSystemReferenceId: resDocusign?.envelopeId };
  }

  @GetDocusignIntegrationInstance(DOCUSIGN_API_TYPE.GSP)
  async sendGSPContractToDocusign(
    contractId: string,
    templateDetails: ITemplateDetailSchema[],
    signerDetails: ISignerDetailDataSchema[],
    genericObject: IGenericObjectForGSP,
    pageFromTemplateId: string,
    contractName: string,
    isDraft = false,
  ): Promise<ISendDocusignToContractResponse> {
    const docusignPayload: any = {
      emailSubject: `Contract - Agreement for ${contractName}`,
      emailBlurb: 'Please review and sign the contract for your energy project!',
      compositeTemplates: [],
    };

    const maxSignerRoutingOrders = this.getMaxSignerRoutingOrders(templateDetails);

    templateDetails.map(template => {
      const compositeTemplateDataPayload = this.getCompositeTemplatePayloadData(
        template,
        signerDetails,
        maxSignerRoutingOrders,
      );
      docusignPayload.compositeTemplates.push(compositeTemplateDataPayload);
    });

    const resDocusign = await this.docusignGSPApiService
      .useContext(genericObject)
      .sendContract(
        docusignPayload,
        templateDetails.find(e => e.id === pageFromTemplateId)?.docusignTemplateId ?? '',
        isDraft,
      );

    const model = new this.docusignCommunicationModel({
      dateTime: new Date(),
      contractId: isDraft ? undefined : contractId,
      requestType: REQUEST_TYPE.OUTBOUND,
      docusignAccountDetail: { accountName: 'docusign', accountReferenceId: this.docusignGSPApiService.email },
      payloadFromDocusign: JSON.stringify(resDocusign),
      envelopId: resDocusign?.envelopeId,
      proposalId: isDraft ? contractId : undefined,
    });

    await model.save();

    if (resDocusign?.errorDetails?.errorCode) {
      return { status: 'FAILURE' };
    }

    return { status: 'SUCCESS', contractingSystemReferenceId: resDocusign?.envelopeId };
  }

  getCompositeTemplatePayloadData(
    template: ITemplateDetailSchema,
    signerDetails: ISignerDetailDataSchema[],
    maxSignerRoutingOrders: string[],
  ): ICompositeTemplate {
    let runningCounter = 0;
    const compositeTemplateDataPayload: ICompositeTemplate = {
      serverTemplates: [],
      inlineTemplates: [],
    };
    runningCounter += 1;

    const serverTemplatesDataPayload: IServerTemplate = {
      sequence: 0,
      templateId: '',
    };

    serverTemplatesDataPayload.sequence = runningCounter;
    serverTemplatesDataPayload.templateId = template.docusignTemplateId;
    compositeTemplateDataPayload.serverTemplates.push(serverTemplatesDataPayload);

    runningCounter += 1;
    const inlineTemplateDataPayload: IInlineTemplate = {
      sequence: 0,
      recipients: {
        signers: [],
        carbonCopies: [],
      },
    };
    inlineTemplateDataPayload.sequence = runningCounter;

    template.recipientRoles.map(role => {
      const signerDataPayload: ISignerData = {} as any;
      const signerDetailData = signerDetails.find(signer => signer.roleId === `${role._id}`);

      // const order = this.const

      const order = maxSignerRoutingOrders.findIndex(e => e === role._id.toString());

      if (!signerDetailData) return;

      const signerName = signerDetailData.fullName || signerDetailData.role;

      signerDataPayload.email = signerDetailData.email;
      signerDataPayload.name = signerName;
      signerDataPayload.recipientId = (order + 1).toString();
      signerDataPayload.roleName = signerDetailData.role;
      signerDataPayload.routingOrder = (order + 1).toString();
      signerDataPayload.templateId = template.docusignTemplateId;

      if (signerDataPayload.email) {
        inlineTemplateDataPayload.recipients.signers.push(signerDataPayload);
      }
    });

    inlineTemplateDataPayload.recipients.carbonCopies = signerDetails
      .filter(signer => !template.recipientRoles.find(role => role._id.toString() === signer.roleId))
      .map(signer => {
        const order = maxSignerRoutingOrders.findIndex(e => e === signer.roleId);

        return {
          email: signer.email,
          name: signer.fullName || signer.role,
          recipientId: `${order + 1}`,
          routingOrder: `${order + 1}`,
        };
      });

    compositeTemplateDataPayload.inlineTemplates.push(inlineTemplateDataPayload);

    return compositeTemplateDataPayload;
  }

  // ========================= INTERNAL =========================

  async getCommunicationsByContractId(contractId: string): Promise<LeanDocument<DocusignCommunication>[]> {
    const res = await this.docusignCommunicationModel.find({ contractId }).lean();

    return res;
  }

  @GetDocusignIntegrationInstance(DOCUSIGN_API_TYPE.DEFAULT)
  downloadContract(envelopeId: string, showChanges: boolean): Promise<IncomingMessage> {
    return this.docusignApiService.getEnvelopeDocumentById(envelopeId, showChanges);
  }

  @GetDocusignIntegrationInstance(DOCUSIGN_API_TYPE.DEFAULT)
  resendContract(envelopeId: string): Promise<TResendEnvelopeStatus> {
    return this.docusignApiService.resendEnvelop(envelopeId);
  }

  @GetDocusignIntegrationInstance(DOCUSIGN_API_TYPE.DEFAULT)
  sendDraftContract(envelopeId: string): Promise<TResendEnvelopeStatus> {
    return this.docusignApiService.sendDraftEnvelop(envelopeId);
  }

  @GetDocusignIntegrationInstance(DOCUSIGN_API_TYPE.GSP)
  downloadGSPContract(envelopeId: string, showChanges: boolean): Promise<IncomingMessage> {
    return this.docusignGSPApiService.getEnvelopeDocumentById(envelopeId, showChanges);
  }

  @GetDocusignIntegrationInstance(DOCUSIGN_API_TYPE.GSP)
  resendGSPContract(envelopeId: string): Promise<TResendEnvelopeStatus> {
    return this.docusignGSPApiService.resendEnvelop(envelopeId);
  }

  @GetDocusignIntegrationInstance(DOCUSIGN_API_TYPE.GSP)
  sendGSPDraftContract(envelopeId: string): Promise<TResendEnvelopeStatus> {
    return this.docusignGSPApiService.sendDraftEnvelop(envelopeId);
  }

  validateSignerDetails(
    templateDetails: (Omit<LeanDocument<DocusignTemplateMaster>, 'recipientRoles'> & {
      recipientRoles: LeanDocument<SignerRoleMaster>[];
    })[],
    signerDetails: SignerDetailDto[],
  ): void {
    const missingInfoSigner = signerDetails.find(signer => !signer.email || !signer.roleId || signer.fullName);
    if (missingInfoSigner) {
      console.error('Some signers information is missing, signerDetail:', missingInfoSigner);
      throw new NotFoundException(`${missingInfoSigner.role}'s information is missing.`);
    }

    // Missing signer role(s) from templateDetails
    const templateWithMissingRole = templateDetails.find(template =>
      template.recipientRoles.some(role => !signerDetails.find(signer => compareIds(signer.roleId, role._id))),
    );

    if (templateWithMissingRole) {
      console.error('Some signer roles are missing, signerDetails', signerDetails);
      console.error('templateWithMissingRole', templateWithMissingRole);
      throw new NotFoundException('Some signer roles are missing');
    }
  }

  @GetDocusignIntegrationInstance(DOCUSIGN_API_TYPE.DEFAULT)
  sendWetSingedContract(
    contractId: string,
    financier: ISignerDetailDataSchema,
    carbonCopyRecipients: ISignerDetailDataSchema[],
    contractFile: FastifyFile,
    emailSubject: string,
  ): Promise<EnvelopeSummary> {
    // contractId will be used in GetDocusignIntegrationInstance decorator
    return this.docusignApiService.sendWetSignedContract(
      contractFile.file,
      contractFile.filename,
      'pdf',
      'application/pdf',
      emailSubject,
      {
        name: financier.fullName,
        email: financier.email,
      },
      carbonCopyRecipients.map(e => ({ email: e.email, name: e.fullName })),
    );
  }

  @GetDocusignIntegrationInstance(DOCUSIGN_API_TYPE.DEFAULT)
  voidEnvelope(envelopeId: string): Promise<EnvelopeUpdateSummary> {
    return this.docusignApiService.voidEnvelope(envelopeId);
  }

  @GetDocusignIntegrationInstance(DOCUSIGN_API_TYPE.GSP)
  voidGSPEnvelope(envelopeId: string): Promise<EnvelopeUpdateSummary> {
    return this.docusignGSPApiService.voidEnvelope(envelopeId);
  }

  private getMaxSignerRoutingOrders(templateDetails: ITemplateDetailSchema[]): string[] {
    let maxRecipientsTemplateIdx = 0;
    let maxRecipientsTemplate = 0;

    templateDetails.forEach((template, idx) => {
      if (template.recipientRoles.length > maxRecipientsTemplate) {
        maxRecipientsTemplate = template.recipientRoles.length;
        maxRecipientsTemplateIdx = idx;
      }
    });

    return templateDetails[maxRecipientsTemplateIdx].recipientRoles.map((role: LeanDocument<SignerRoleMaster>) =>
      role._id.toString(),
    );
  }
}

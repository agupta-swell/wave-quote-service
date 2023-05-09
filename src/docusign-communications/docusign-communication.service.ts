import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { ContractService } from 'src/contracts/contract.service';
import { IncomingMessage } from 'http';
import { DocusignTemplateMaster } from 'src/docusign-templates-master/docusign-template-master.schema';
import { SignerRoleMaster } from 'src/docusign-templates-master/schemas';
import { SignerDetailDto } from 'src/contracts/req/sub-dto/signer-detail.dto';
import { compareIds } from 'src/utils/common';
import { DocusignApiService, TResendEnvelopeStatus } from 'src/shared/docusign';
import { EnvelopeSummary, EnvelopeUpdateSummary } from 'docusign-esign';
import {
  CONTRACTING_SYSTEM_STATUS,
  ICompositeTemplate,
  IContractSignerDetails,
  IDocusignPayload,
  IGenericObject,
  IGenericObjectForGSP,
  IInlineTemplate,
  ISendDocusignToContractResponse,
  IServerTemplate,
  ISignerData,
  ISignerDetailFromContractingSystemData,
  REQUEST_TYPE,
} from './typing';
import { DocusignCommunication, DOCUSIGN_COMMUNICATION } from './docusign-communication.schema';
import { ISignerDetailDataSchema, ITemplateDetailSchema } from '../contracts/contract.schema';
import { FastifyFile } from '../shared/fastify';

@Injectable()
export class DocusignCommunicationService {
  constructor(
    @InjectModel(DOCUSIGN_COMMUNICATION) private readonly docusignCommunicationModel: Model<DocusignCommunication>,
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
    private readonly docusignApiService: DocusignApiService<IGenericObject>,
    private readonly docusignGSPApiService: DocusignApiService<IGenericObjectForGSP>,
  ) {}

  // =====================> INTERNAL <=====================
  async sendContractToDocusign(
    contractId: string,
    templateDetails: ITemplateDetailSchema[],
    signerDetails: ISignerDetailDataSchema[],
    genericObject: IGenericObject,
    pageFromTemplateId: string,
    isDraft = false,
  ): Promise<ISendDocusignToContractResponse> {
    const docusignPayload: any = {
      emailSubject: `${genericObject.contact.lastName}, ${genericObject.contact.firstName} - ${genericObject.contract?.name}`,
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
      emailSubject: `${'Contract'} - Agreement for ${contractName}`,
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

  async callBackFromDocusign(payloadFromDocusign: IDocusignPayload): Promise<boolean> {
    const foundDocusignCommunication = await this.docusignCommunicationModel.findOne({
      envelopId: payloadFromDocusign.EnvelopeID[0],
    });

    const docusignCommunication = {
      dateTime: new Date(),
      contractId: foundDocusignCommunication?.contractId,
      envelopId: payloadFromDocusign.EnvelopeID[0],
      requestType: REQUEST_TYPE.INBOUND,
    };

    const model = new this.docusignCommunicationModel(docusignCommunication);
    model.save();

    const contractSignerDetails = {} as IContractSignerDetails;
    contractSignerDetails.contractSystemReferenceId = payloadFromDocusign.EnvelopeID[0];
    contractSignerDetails.contractingSystem = 'DOCUSIGN';
    if (payloadFromDocusign.Status[0] === 'Completed') {
      contractSignerDetails.overallContractStatus = 'COMPLETED';
    }

    const statusesData = payloadFromDocusign.RecipientStatuses.map(recipientStatus => {
      const signerDetail = {} as ISignerDetailFromContractingSystemData;
      signerDetail.emailId = recipientStatus.Email[0];
      if (recipientStatus.Status[0] === 'Sent') {
        signerDetail.status = CONTRACTING_SYSTEM_STATUS.SENT;
        signerDetail.date = recipientStatus.Sent[0];
      }
      if (recipientStatus.Status[0] === 'Completed') {
        signerDetail.status = CONTRACTING_SYSTEM_STATUS.SIGNED;
        signerDetail.date = recipientStatus.Signed[0];
      }

      return signerDetail;
    });

    contractSignerDetails.statusesData = statusesData;

    await this.contractService.updateContractByDocusign(contractSignerDetails);
    return true;
  }

  // ========================= INTERNAL =========================

  async getCommunicationsByContractId(contractId: string): Promise<LeanDocument<DocusignCommunication>[]> {
    const res = await this.docusignCommunicationModel.find({ contractId }).lean();

    return res;
  }

  downloadContract(envelopeId: string, showChanges: boolean): Promise<IncomingMessage> {
    return this.docusignApiService.getEnvelopeDocumentById(envelopeId, showChanges);
  }

  resendContract(envelopeId: string): Promise<TResendEnvelopeStatus> {
    return this.docusignApiService.resendEnvelop(envelopeId);
  }

  sendDraftContract(envelopeId: string): Promise<TResendEnvelopeStatus> {
    return this.docusignApiService.sendDraftEnvelop(envelopeId);
  }

  downloadGSPContract(envelopeId: string, showChanges: boolean): Promise<IncomingMessage> {
    return this.docusignGSPApiService.getEnvelopeDocumentById(envelopeId, showChanges);
  }

  resendGSPContract(envelopeId: string): Promise<TResendEnvelopeStatus> {
    return this.docusignGSPApiService.resendEnvelop(envelopeId);
  }

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

  sendWetSingedContract(
    financier: ISignerDetailDataSchema,
    carbonCopyRecipients: ISignerDetailDataSchema[],
    contractFile: FastifyFile,
    emailSubject: string,
  ): Promise<EnvelopeSummary> {
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

  voidEnvelope(envelopeId: string): Promise<EnvelopeUpdateSummary> {
    return this.docusignApiService.voidEnvelope(envelopeId);
  }

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

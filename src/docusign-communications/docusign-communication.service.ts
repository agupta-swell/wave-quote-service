import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { ContractService } from 'src/contracts/contract.service';
import { DocusignAPIService } from 'src/external-services/sub-services/docusign-api.service';
import { IncomingMessage } from 'http';
import { ISignerDetailDataSchema, ITemplateDetailSchema } from '../contracts/contract.schema';
import { DocusignCommunication, DOCUSIGN_COMMUNICATION } from './docusign-communication.schema';
import { DocusignTemplateService } from './sub-services/docusign-template.service';
import {
  CONTRACTING_SYSTEM_STATUS,
  ICompositeTemplate,
  IContractSignerDetails,
  IDefaultContractor,
  IDocusignCompositeContract,
  IDocusignPayload,
  IGenericObject,
  IInlineTemplate,
  ISendDocusignToContractResponse,
  IServerTemplate,
  ISignerData,
  ISignerDetailFromContractingSystemData,
  ITabData,
  REQUEST_TYPE,
} from './typing';
import { TResendEnvelopeStatus } from 'src/external-services/typing';
import { DocusignTemplateMaster } from 'src/docusign-templates-master/docusign-template-master.schema';
import { SignerRoleMaster } from 'src/docusign-templates-master/schemas';
import { SignerDetailDto } from 'src/contracts/req/sub-dto/signer-detail.dto';
import { compareIds } from 'src/utils/common';

@Injectable()
export class DocusignCommunicationService {
  constructor(
    @InjectModel(DOCUSIGN_COMMUNICATION) private readonly docusignCommunicationModel: Model<DocusignCommunication>,
    private readonly docusignTemplateService: DocusignTemplateService,
    private readonly docusignAPIService: DocusignAPIService,
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
  ) {}

  // =====================> INTERNAL <=====================
  async sendContractToDocusign(
    contractId: string,
    templateDetails: ITemplateDetailSchema[],
    signerDetails: ISignerDetailDataSchema[],
    genericObject: IGenericObject,
    isDraft = false,
  ): Promise<ISendDocusignToContractResponse> {
    // see: https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopes/create/
    const docusignPayload: IDocusignCompositeContract = {
      status: isDraft ? 'created' : 'sent',
      emailSubject: `${
        genericObject.quote.quoteFinanceProduct?.financeProduct?.financialProductSnapshot?.name || 'Contract'
      } - Agreement for ${genericObject.opportunity.name}`,
      emailBlurb: 'Please review and sign the contract for your energy project!',
      compositeTemplates: [],
    };

    const docusignSecret = await this.docusignAPIService.getDocusignSecret();

    templateDetails.map(template => {
      const compositeTemplateDataPayload = this.getCompositeTemplatePayloadData(
        template,
        signerDetails,
        genericObject,
        docusignSecret.docusign.defaultContractor,
      );
      docusignPayload.compositeTemplates.push(compositeTemplateDataPayload);
    });

    const resDocusign = await this.docusignAPIService.sendTemplate(docusignPayload);

    const model = new this.docusignCommunicationModel({
      dateTime: new Date(),
      contractId: isDraft ? undefined : contractId,
      requestType: REQUEST_TYPE.OUTBOUND,
      docusignAccountDetail: { accountName: 'docusign', accountReferenceId: docusignSecret.docusign.email },
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
    genericObject: IGenericObject,
    defaultContractor: IDefaultContractor,
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
      },
    };
    inlineTemplateDataPayload.sequence = runningCounter;

    template.recipientRoles.map((role, index) => {
      const signerDataPayload: ISignerData = {} as any;
      const signerDetailData = signerDetails.find(signer => signer.roleId === `${role._id}`);

      if (!signerDetailData) return;

      const signerName = `${signerDetailData.firstName} ${signerDetailData.lastName}`.trim() || signerDetailData.role;

      signerDataPayload.email = signerDetailData.email;
      signerDataPayload.name = signerName;
      signerDataPayload.recipientId = (index + 1).toString();
      signerDataPayload.roleName = signerDetailData.role;
      signerDataPayload.routingOrder = (index + 1).toString();
      signerDataPayload.tabs = this.docusignTemplateService.buildTemplateData(
        template.docusignTemplateId,
        genericObject,
        defaultContractor,
      ) as ITabData;

      if (signerDataPayload.email) {
        inlineTemplateDataPayload.recipients.signers.push(signerDataPayload);
      }
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

  downloadContract(envelopeId: string): Promise<IncomingMessage> {
    return this.docusignAPIService.getEnvelopeDocumentById(envelopeId);
  }

  resendContract(envelopeId: string): Promise<TResendEnvelopeStatus> {
    return this.docusignAPIService.resendEnvelop(envelopeId);
  }

  validateSignerDetails(
    templateDetails: (Omit<LeanDocument<DocusignTemplateMaster>, 'recipientRoles'> & {
      recipientRoles: LeanDocument<SignerRoleMaster>[];
    })[],
    signerDetails: SignerDetailDto[],
  ): void {
    const missingInfoSigner = signerDetails.find(
      signer => !signer.email || !signer.roleId || (!signer.firstName && !signer.lastName),
    );
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
}

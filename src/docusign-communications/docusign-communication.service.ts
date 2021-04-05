import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as AWS from 'aws-sdk';
import { LeanDocument, Model } from 'mongoose';
import { Contract } from 'src/contracts/contract.schema';
import { ContractService } from 'src/contracts/contract.service';
import { DocusignAPIService } from 'src/external-services/sub-services/docusign-api.service';
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

@Injectable()
export class DocusignCommunicationService {
  AWS_REGION: string;

  client: AWS.SecretsManager;

  constructor(
    @InjectModel(DOCUSIGN_COMMUNICATION) private readonly docusignCommunicationModel: Model<DocusignCommunication>,
    private readonly docusignTemplateService: DocusignTemplateService,
    private readonly docusignAPIService: DocusignAPIService,
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
  ) {}

  // =====================> INTERNAL <=====================
  async sendContractToDocusign(
    contract: LeanDocument<Contract>,
    data: IGenericObject,
  ): Promise<ISendDocusignToContractResponse> {
    const docusignPayload: IDocusignCompositeContract = {
      status: 'sent',
      emailSubject: 'DocuSign API - Composite Templates',
      emailBlurb: 'Composite Templates Sample 1',
      compositeTemplates: [],
    };

    const docusignSecret = await this.docusignAPIService.getDocusignSecret();
    contract.contract_template_detail.template_details.map(template => {
      const compositeTemplateDataPayload = this.getCompositeTemplatePayloadData(
        template,
        contract.signer_details,
        data,
        docusignSecret.docusign.defaultContractor,
      );

      docusignPayload.compositeTemplates.push(compositeTemplateDataPayload);
    });

    const resDocusign = await this.docusignAPIService.sendTemplate(docusignPayload);

    const model = new this.docusignCommunicationModel({
      date_time: new Date(),
      contract_id: contract?._id?.toString(),
      request_type: REQUEST_TYPE.OUTBOUND,
      docusign_account_detail: { account_name: 'docusign', account_reference_id: docusignSecret.docusign.email },
      payload_from_docusign: JSON.stringify(resDocusign),
      envelop_id: resDocusign?.envelopeId,
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
    serverTemplatesDataPayload.templateId = template.docusign_template_id;
    compositeTemplateDataPayload.serverTemplates.push(serverTemplatesDataPayload);

    runningCounter += 1;
    const inlineTemplateDataPayload: IInlineTemplate = {
      sequence: 0,
      recipients: {
        signers: [],
      },
    };
    inlineTemplateDataPayload.sequence = runningCounter;

    template.recipient_roles.map((role, index) => {
      const signerDataPayload: ISignerData = {} as any;
      const signerDetailData = signerDetails.find(signer => signer.role_id === role._id.toString()) || ({} as any);

      if (!signerDetailData) return;

      const signerName =
        (signerDetailData.first_name &&
          signerDetailData.last_name &&
          `${signerDetailData.first_name} ${signerDetailData.last_name}`) ||
        'Signer name';

      signerDataPayload.email = signerDetailData.email;
      signerDataPayload.name = signerName;
      signerDataPayload.recipientId = (index + 1).toString();
      signerDataPayload.roleName = signerDetailData.role;
      signerDataPayload.routingOrder = (index + 1).toString();
      signerDataPayload.tabs = this.docusignTemplateService.buildTemplateData(
        template.docusign_template_id,
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
      envelop_id: payloadFromDocusign.EnvelopeID[0],
    });

    const docusignCommunication = {
      date_time: new Date(),
      contract_id: foundDocusignCommunication?.contract_id,
      envelop_id: payloadFromDocusign.EnvelopeID[0],
      request_type: REQUEST_TYPE.INBOUND,
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
    const res = await this.docusignCommunicationModel.find({ contract_id: contractId }).lean();
    return res;
  }
}

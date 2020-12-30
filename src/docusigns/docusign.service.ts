import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as AWS from 'aws-sdk';
import { Model } from 'mongoose';
import { Contract } from 'src/contracts/contract.schema';
import { ContractService } from 'src/contracts/contract.service';
import { DocusignAPIService } from 'src/external-services/sub-services/docusign-api.service';
import { ISignerDetailDataSchema, ITemplateDetailSchema } from './../contracts/contract.schema';
import { REQUEST_TYPE } from './constants';
import { DOCUSIGN, Docusign } from './docusign.schema';
import { DocusignTemplateService } from './sub-services/docusign-template.service';
import {
  ICompositeTemplate,
  IDefaultContractor,
  IDocusignCompositeContract,
  IDocusignPayload,
  IGenericObject,
  IInlineTemplate,
  IServerTemplate,
  ISignerData,
} from './typing.d';

@Injectable()
export class DocusignService {
  AWS_REGION: string;
  client: AWS.SecretsManager;

  constructor(
    @InjectModel(DOCUSIGN) private readonly docusignModel: Model<Docusign>,
    private readonly docusignTemplateService: DocusignTemplateService,
    private readonly docusignAPIService: DocusignAPIService,
    @Inject(forwardRef(() => ContractService))
    private readonly contractService: ContractService,
  ) {}

  // =====================> INTERNAL <=====================
  async sendContractToDocusign(contract: Contract, data: IGenericObject): Promise<'SUCCESS' | 'FAILURE'> {
    const docusignPayload = { status: 'sent' } as IDocusignCompositeContract;
    const docusignSecret = await this.docusignAPIService.getDocusignSecret();
    contract.contract_template_detail.template_details.map(template => {
      const compositeTempalteDataPayload = this.getCompositeTemplatePayloadData(
        template,
        contract.signer_details,
        data,
        docusignSecret.docusign.defaultContractor,
      );

      docusignPayload.compositeTemplates.push(compositeTempalteDataPayload);
    });

    const resDocusign = await this.docusignAPIService.sendTemplate(docusignPayload);

    const model = new this.docusignModel({
      date_time: new Date(),
      contract_id: contract?._id?.toString(),
      request_type: REQUEST_TYPE.OUTBOUND,
      docusign_account_detail: { account_name: 'docusign', account_reference_id: docusignSecret['docusign'].email },
      payload_from_docusign: JSON.stringify(resDocusign),
      envelop_id: resDocusign.envelopeId,
    });

    await model.save();

    if (resDocusign.errorDetails?.errorCode) {
      return 'FAILURE';
    }

    return 'SUCCESS';
  }

  getCompositeTemplatePayloadData(
    template: ITemplateDetailSchema,
    signerDetails: ISignerDetailDataSchema[],
    genericObject: IGenericObject,
    defaultContractor: IDefaultContractor,
  ): ICompositeTemplate {
    let runningCounter = 0;
    const compositeTemplateDataPayload: ICompositeTemplate = {} as any;
    runningCounter += 1;

    const serverTemplatesDataPayload: IServerTemplate = {} as any;

    serverTemplatesDataPayload.sequence = runningCounter;
    serverTemplatesDataPayload.templateId = template.docusign_template_id;
    compositeTemplateDataPayload.serverTemplates.push(serverTemplatesDataPayload);

    runningCounter += 1;
    const inlineTemplateDataPayload: IInlineTemplate = {} as any;
    inlineTemplateDataPayload.sequence = runningCounter;

    template.recipient_roles.map((role, index) => {
      const signerDataPayload: ISignerData = {} as any;
      const signerDetailData = signerDetails.find(signer => signer.role_id === role._id);

      signerDataPayload.email = signerDetailData.email;
      signerDataPayload.name = `${signerDetailData.first_name} ${signerDetailData.last_name}`;
      signerDataPayload.recipientId = signerDetailData.email;
      signerDataPayload.roleName = signerDetailData.role;
      signerDataPayload.routingOrder = index + 1;
      signerDataPayload.tabs = this.docusignTemplateService.buildTemplateData(
        template.docusign_template_id,
        genericObject,
        defaultContractor,
      );
      inlineTemplateDataPayload.recipients.signers.push(signerDataPayload);
    });

    compositeTemplateDataPayload.inlineTemplates.push(inlineTemplateDataPayload);

    return compositeTemplateDataPayload;
  }

  async callBackFromDocusign(payloadFromDocusign: IDocusignPayload): Promise<boolean> {
    const foundDocusignCommunication = await this.docusignModel.findOne({
      envelop_id: payloadFromDocusign.EnvelopeID[0],
    });

    const docusignCommunication = {
      date_time: new Date(),
      contract_id: foundDocusignCommunication.contract_id,
      envelop_id: payloadFromDocusign.EnvelopeID[0],
      request_type: REQUEST_TYPE.INBOUND,
      payload_from_docusign: JSON.stringify(payloadFromDocusign),
    };

    const model = new this.docusignModel(docusignCommunication);
    model.save();

    await this.contractService.updateContractByDocusign(payloadFromDocusign);
    return true;
  }
}

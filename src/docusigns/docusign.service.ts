import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contract } from 'src/contracts/contract.schema';
import { ISignerDetailDataSchema, ITemplateDetailSchema } from './../contracts/contract.schema';
import { DOCUSIGN, Docusign } from './docusign.schema';
import {
  ICompositeTemplate,
  IDocusignCompositeContract,
  IGenericObject,
  IInlineTemplate,
  IServerTemplate,
  ISignerData,
} from './typing.d';

@Injectable()
export class DocusignService {
  constructor(@InjectModel(DOCUSIGN) private readonly docusignModel: Model<Docusign>) {}

  // =====================> INTERNAL <=====================
  async sendContractToDocusign(contract: Contract, data: IGenericObject): Promise<string> {
    const docusignPayload = {} as IDocusignCompositeContract;
    let runningCounter = 0;
    contract.contract_template_detail.template_details.map(template => {
      const compositeTempalteDataPayload = this.getCompositeTemplatePayloadData(
        template,
        contract.signer_details,
        data,
      );
    });
    return;
  }

  getCompositeTemplatePayloadData(
    template: ITemplateDetailSchema,
    signerDetails: ISignerDetailDataSchema[],
    genericObject: IGenericObject,
  ): ICompositeTemplate {
    let runningCounter = 0;
    const compositeTemplateDataPayload: ICompositeTemplate = {} as any;
    runningCounter += 1;

    const serverTemplatesDataPayload: IServerTemplate = {} as any;

    serverTemplatesDataPayload.sequence = runningCounter;
    serverTemplatesDataPayload.templateId = template.id;
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
    });

    return;
  }
}

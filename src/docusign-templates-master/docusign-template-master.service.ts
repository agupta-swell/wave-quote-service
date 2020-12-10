import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { SAVE_TEMPLATE_MODE } from './constants';
import { DocusignTemplateMaster, DOCUSIGN_TEMPLATE_MASTER } from './docusign-template-master.schema';
import { SaveTemplateReqDto } from './req';
import { GetSignerRoleMasterDto, SaveTemplateDto } from './res';
import { GetTemplateMasterDto } from './res/get-template-master.dto';
import { SignerRoleMaster, SIGNER_ROLE_MASTER } from './schemas';

@Injectable()
export class DocusignTemplateMasterService {
  constructor(
    @InjectModel(DOCUSIGN_TEMPLATE_MASTER) private readonly docusignTemplateMasterModel: Model<DocusignTemplateMaster>,
    @InjectModel(SIGNER_ROLE_MASTER) private readonly signerRoleMasterModel: Model<SignerRoleMaster>,
  ) {}

  async getTemplateMasters(): Promise<OperationResult<GetTemplateMasterDto>> {
    const res = await this.docusignTemplateMasterModel.find();
    return OperationResult.ok(new GetTemplateMasterDto(res?.map(item => item.toObject()) || []));
  }

  async getSignerRoleMasters(): Promise<OperationResult<GetSignerRoleMasterDto>> {
    const res = await this.signerRoleMasterModel.find();
    return OperationResult.ok(new GetSignerRoleMasterDto(res?.map(item => item.toObject()) || []));
  }

  async saveTemplate(req: SaveTemplateReqDto): Promise<OperationResult<SaveTemplateDto>> {
    if (req.mode === SAVE_TEMPLATE_MODE.NEW && req.templateData.id != null) {
      return OperationResult.ok(new SaveTemplateDto('INVALID_MODE_PARAMETER'));
    }

    if (req.mode === SAVE_TEMPLATE_MODE.UPDATE && req.templateData.id == null) {
      return OperationResult.ok(new SaveTemplateDto('INVALID_MODE_PARAMETER'));
    }

    const recipientRoles = (
      await Promise.all(req.templateData.recipientRoles.map(id => this.signerRoleMasterModel.findById(id)))
    )?.map(({ _id, role_name, role_description }) => ({ id: _id, role_name, role_description }));

    const model = await this.docusignTemplateMasterModel.findOneAndUpdate(
      { _id: req.templateData.id || Types.ObjectId() },
      {
        template_name: req.templateData.templateName,
        description: req.templateData.description,
        docusign_template_id: req.templateData.docusignTemplateId,
        recipient_roles: recipientRoles,
        template_status: req.templateData.templateStatus,
      },
      { new: true, upsert: true },
    );

    return OperationResult.ok(new SaveTemplateDto('SUCCESS', model.toObject()));
  }

  // ===================== INTERNAL =====================

  async countByOpportunityId(opportunityId: string): Promise<number> {
    return await this.docusignTemplateMasterModel.countDocuments({ opportunity_id: opportunityId }).exec();
  }

  // ===================== INTERNAL =====================
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { DocusignTemplateMaster, DOCUSIGN_TEMPLATE_MASTER } from './docusign-template-master.schema';
import { GetSignerRoleMasterDto } from './res';
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

  // ===================== INTERNAL =====================

  async countByOpportunityId(opportunityId: string): Promise<number> {
    return await this.docusignTemplateMasterModel.countDocuments({ opportunity_id: opportunityId }).exec();
  }

  // ===================== INTERNAL =====================
}

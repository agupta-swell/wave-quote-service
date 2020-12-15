import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { toCamelCase } from 'src/utils/transformProperties';
import { SAVE_TEMPLATE_MODE } from './constants';
import { DocusignTemplateMaster, DOCUSIGN_TEMPLATE_MASTER } from './docusign-template-master.schema';
import { SaveContractCompositeTemplateReqDto, SaveTemplateReqDto } from './req';
import {
  GetContractApplicabilityDataDto,
  GetContractCompositeTemplateDto,
  GetSignerRoleMasterDto,
  GetTemplateMasterDto,
  SaveContractCompositeTemplateDto,
  SaveTemplateDto,
} from './res';
import {
  DocusignCompositeTemplateMaster,
  DOCUSIGN_COMPOSITE_TEMPLATE_MASTER,
  SignerRoleMaster,
  SIGNER_ROLE_MASTER,
  UtilityMaster,
  UTILITY_MASTER,
} from './schemas';

@Injectable()
export class DocusignTemplateMasterService {
  constructor(
    @InjectModel(DOCUSIGN_TEMPLATE_MASTER) private readonly docusignTemplateMasterModel: Model<DocusignTemplateMaster>,
    @InjectModel(SIGNER_ROLE_MASTER) private readonly signerRoleMasterModel: Model<SignerRoleMaster>,
    @InjectModel(UTILITY_MASTER) private readonly utilityMasterModel: Model<UtilityMaster>,
    @InjectModel(DOCUSIGN_COMPOSITE_TEMPLATE_MASTER)
    private readonly docusignCompositeTemplateMasterModel: Model<DocusignCompositeTemplateMaster>,
    private readonly utilityProgramMasterService: UtilityProgramMasterService,
    private readonly fundingSourceService: FundingSourceService,
  ) {}

  async getTemplateMasters(): Promise<OperationResult<GetTemplateMasterDto>> {
    const res = await this.docusignTemplateMasterModel.find();
    const data = await Promise.all(
      res.map(async item => {
        const recipientRoles = await Promise.all(
          item.recipient_roles.map(roleId => this.signerRoleMasterModel.findById(roleId)),
        );

        return {
          ...item.toObject({ versionKey: false }),
          recipient_roles: recipientRoles.map(role => toCamelCase(role.toObject({ versionKey: false }))),
        };
      }),
    );
    return OperationResult.ok(new GetTemplateMasterDto(data || []));
  }

  async getSignerRoleMasters(): Promise<OperationResult<GetSignerRoleMasterDto>> {
    const res = await this.signerRoleMasterModel.find();
    return OperationResult.ok(new GetSignerRoleMasterDto(res?.map(item => item.toObject({ versionKey: false })) || []));
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
        recipient_roles: req.templateData.recipientRoles,
        template_status: req.templateData.templateStatus,
      },
      { new: true, upsert: true },
    );

    return OperationResult.ok(
      new SaveTemplateDto('SUCCESS', { ...model.toObject({ versionKey: false }), recipient_roles: recipientRoles }),
    );
  }

  async getContractCompositeTemplates(): Promise<OperationResult<GetContractCompositeTemplateDto>> {
    const compositeTemplate = await this.docusignCompositeTemplateMasterModel.find();

    const compositeTemplateDetails = await Promise.all(
      compositeTemplate.map(async item => {
        const docusignTemplates = await Promise.all(
          item.docusign_template_ids.map(async templateId => {
            const template = await this.docusignTemplateMasterModel.findById(templateId);
            const roles = await Promise.all(
              template.recipient_roles.map(roleId => this.signerRoleMasterModel.findById(roleId)),
            );

            return toCamelCase<any>({
              ...template.toObject({ versionKey: false }),
              recipient_roles: roles.map(role => toCamelCase(role.toObject({ versionKey: false }))),
            });
          }),
        );

        return { templateDetails: docusignTemplates, compositeTemplateData: item.toObject({ versionKey: false }) };
      }),
    );

    return OperationResult.ok(new GetContractCompositeTemplateDto(compositeTemplateDetails));
  }

  async getContractApplicabilityData(): Promise<OperationResult<GetContractApplicabilityDataDto>> {
    const [utilitiesMaster, utilityProgramsMaster, fundingSources] = await Promise.all([
      this.utilityMasterModel.find(),
      this.utilityProgramMasterService.getAll(),
      this.fundingSourceService.getAll(),
    ]);

    return OperationResult.ok(
      new GetContractApplicabilityDataDto({
        applicableUtilities: utilitiesMaster.map(item => item.toObject({ versionKey: false })),
        applicableFundingSources: fundingSources,
        applicableUtilityPrograms: utilityProgramsMaster,
      }),
    );
  }

  async saveContractCompositeTemplate(
    req: SaveContractCompositeTemplateReqDto,
  ): Promise<OperationResult<SaveContractCompositeTemplateDto>> {
    if (req.mode === SAVE_TEMPLATE_MODE.NEW && req.compositeTemplateData.id != null) {
      return OperationResult.ok(new SaveContractCompositeTemplateDto('INVALID_MODE_PARAMETER'));
    }

    if (req.mode === SAVE_TEMPLATE_MODE.UPDATE && req.compositeTemplateData.id == null) {
      return OperationResult.ok(new SaveContractCompositeTemplateDto('INVALID_MODE_PARAMETER'));
    }

    const model = await this.docusignCompositeTemplateMasterModel.findOneAndUpdate(
      { _id: req.compositeTemplateData.id || Types.ObjectId() },
      {
        name: req.compositeTemplateData.name,
        description: req.compositeTemplateData.description,
        docusign_template_ids: req.compositeTemplateData.docusignTemplateIds,
        is_applicable_for_change_orders: req.compositeTemplateData.isApplicableForChangeOrders,
        applicable_funding_sources: req.compositeTemplateData.applicableFundingSources,
        applicable_utility_programs: req.compositeTemplateData.applicableUtilityPrograms,
        applicable_utilities: req.compositeTemplateData.applicableUtilities,
        applicable_states: req.compositeTemplateData.applicableStates,
        applicable_system_types: req.compositeTemplateData.applicableSystemTypes,
      },
      { new: true, upsert: true },
    );

    const docusignTemplates = await Promise.all(
      req.compositeTemplateData.docusignTemplateIds.map(async templateId => {
        const template = await this.docusignTemplateMasterModel.findById(templateId);
        const roles = await Promise.all(
          template.recipient_roles.map(roleId => this.signerRoleMasterModel.findById(roleId)),
        );

        return toCamelCase<any>({
          ...template.toObject({ versionKey: false }),
          recipient_roles: roles.map(role => toCamelCase(role.toObject({ versionKey: false }))),
        });
      }),
    );

    return OperationResult.ok(
      new SaveContractCompositeTemplateDto('SUCCESS', {
        templateDetails: docusignTemplates,
        compositeTemplateData: model.toObject({ versionKey: false }),
      }),
    );
  }

  // ===================== INTERNAL =====================

  async countByOpportunityId(opportunityId: string): Promise<number> {
    return await this.docusignTemplateMasterModel.countDocuments({ opportunity_id: opportunityId }).exec();
  }

  async getUtilityMaster(utilityMasterName: string): Promise<UtilityMaster> {
    const res = await this.utilityMasterModel.findOne({ utility_name: utilityMasterName });
    return res?.toObject({ versionKey: false });
  }

  async getDocusignCompositeTemplateMaster(
    fundingSources: string[],
    utilities: string[],
    utilityPrograms: string[],
  ): Promise<DocusignCompositeTemplateMaster[]> {
    const res = await this.docusignCompositeTemplateMasterModel.find({
      applicable_funding_sources: { $in: fundingSources },
      applicable_utilities: { $in: utilities },
      applicable_utility_programs: { $in: utilityPrograms },
    });

    return res?.map(item => item.toObject({ versionKey: false }));
  }

  // ===================== INTERNAL =====================
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Types } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { TEMPLATE_STATUS } from 'src/docusign-templates-master/constants';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { UtilityService } from 'src/utilities/utility.service';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
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
import { ICompositeTemplateResDto } from './res/get-contract-composite-template.dto';
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
    private readonly utilityService: UtilityService,
  ) {}

  async getTemplatesMaster(): Promise<OperationResult<GetTemplateMasterDto>> {
    const res = await this.docusignTemplateMasterModel.find().lean();
    const data = ((await Promise.all(
      res.map(async item => {
        const recipientRoles = await Promise.all(
          item.recipient_roles.map(roleId => this.signerRoleMasterModel.findById(roleId).lean()),
        );

        return {
          ...item,
          recipient_roles: recipientRoles,
        };
      }),
    )) as unknown) as LeanDocument<DocusignTemplateMaster>[];
    return OperationResult.ok(new GetTemplateMasterDto(data));
  }

  async getSignerRoleMasters(): Promise<OperationResult<GetSignerRoleMasterDto>> {
    const res = await this.signerRoleMasterModel.find().lean();
    return OperationResult.ok(new GetSignerRoleMasterDto(res));
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
    ).map((item: any) => ({ id: item._id, role_name: item.role_name, role_description: item.role_description }));

    const model = await this.docusignTemplateMasterModel
      .findOneAndUpdate(
        { _id: req.templateData.id || Types.ObjectId() },
        {
          template_name: req.templateData.templateName,
          description: req.templateData.description,
          docusign_template_id: req.templateData.docusignTemplateId,
          recipient_roles: req.templateData.recipientRoles,
          template_status: req.templateData.templateStatus,
          createdAt: new Date(),
        },
        { new: true, upsert: true },
      )
      .lean();

    return OperationResult.ok(new SaveTemplateDto('SUCCESS', { ...model, recipient_roles: recipientRoles as any }));
  }

  async getContractCompositeTemplates(): Promise<OperationResult<GetContractCompositeTemplateDto>> {
    const compositeTemplate = await this.docusignCompositeTemplateMasterModel.find().lean();

    const compositeTemplateDetails = (await Promise.all(
      compositeTemplate.map(async item => {
        const docusignTemplates = await Promise.all(
          item.docusign_template_ids.map(async templateId => {
            const template = await this.docusignTemplateMasterModel.findById(templateId).lean();
            if (!template) {
              return [];
            }

            const roles = await Promise.all(
              template.recipient_roles.map(roleId => this.signerRoleMasterModel.findById(roleId).lean()),
            );

            return {
              ...template,
              recipient_roles: roles,
            };
          }),
        );

        return {
          templateDetails: docusignTemplates as any,
          compositeTemplateData: item,
        } as ICompositeTemplateResDto;
      }),
    )) as ICompositeTemplateResDto[];

    return OperationResult.ok(new GetContractCompositeTemplateDto(compositeTemplateDetails));
  }

  async getContractApplicabilityData(): Promise<OperationResult<GetContractApplicabilityDataDto>> {
    const [utilitiesMaster, utilityProgramsMaster, fundingSources] = await Promise.all([
      this.utilityMasterModel.find().lean(),
      this.utilityProgramMasterService.getAll(),
      this.fundingSourceService.getAll(),
    ]);

    return OperationResult.ok(
      new GetContractApplicabilityDataDto({
        applicableUtilities: utilitiesMaster,
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

    const model = await this.docusignCompositeTemplateMasterModel
      .findOneAndUpdate(
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
          createdAt: new Date(),
        },
        { new: true, upsert: true },
      )
      .lean();

    const docusignTemplates = await Promise.all(
      req.compositeTemplateData.docusignTemplateIds.map(async templateId => {
        const template = await this.docusignTemplateMasterModel.findById(templateId).lean();
        if (!template) {
          return [];
        }

        const roles = await Promise.all(
          template.recipient_roles.map(roleId => this.signerRoleMasterModel.findById(roleId).lean()),
        );

        return {
          ...TEMPLATE_STATUS,
          id: template._id,
          recipient_roles: roles,
        };
      }),
    );

    return OperationResult.ok(
      new SaveContractCompositeTemplateDto('SUCCESS', {
        templateDetails: docusignTemplates as any,
        compositeTemplateData: model,
      }),
    );
  }

  // ===================== INTERNAL =====================

  async countByOpportunityId(opportunityId: string): Promise<number> {
    const res = await this.docusignTemplateMasterModel.countDocuments({ opportunity_id: opportunityId });
    return res;
  }

  async getUtilityMaster(utilityMasterName: string): Promise<LeanDocument<UtilityMaster> | null> {
    const res = await this.utilityMasterModel.findOne({ utility_name: utilityMasterName }).lean();
    return res;
  }

  async getDocusignCompositeTemplateMaster(
    fundingSources: string[],
    utilities: string[],
    utilityPrograms: string[],
  ): Promise<LeanDocument<DocusignCompositeTemplateMaster>[]> {
    const res = await this.docusignCompositeTemplateMasterModel
      .find({
        applicable_funding_sources: { $in: fundingSources },
        applicable_utilities: { $in: utilities },
        applicable_utility_programs: { $in: utilityPrograms },
      })
      .lean();

    return res;
  }

  async getCompositeTemplateById(
    compositeTemplateId: string,
  ): Promise<{ template_details: any; composite_template_data: any }> {
    const compositeTemplate = await this.docusignCompositeTemplateMasterModel.findById(compositeTemplateId);

    const docusignTemplates =
      compositeTemplate &&
      (await Promise.all(
        compositeTemplate.docusign_template_ids?.map(async templateId => {
          const template = await this.docusignTemplateMasterModel.findById(templateId);
          if (!template) {
            return [];
          }
          const roles = await Promise.all(
            template.recipient_roles.map(roleId => this.signerRoleMasterModel.findById(roleId)),
          );

          return {
            ...template.toObject({ versionKey: false }),
            id: template._id.toString(),
            recipient_roles: roles?.map(role => role?.toObject({ versionKey: false })),
          };
        }),
      ));

    return {
      template_details: docusignTemplates,
      composite_template_data: compositeTemplate?.toObject({ versionKey: false }),
    };
  }

  // ===================== INTERNAL =====================
}

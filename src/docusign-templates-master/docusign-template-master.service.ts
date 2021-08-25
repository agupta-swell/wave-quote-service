import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Types } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from 'src/app/common';
import { ITemplateDetailSchema } from 'src/contracts/contract.schema';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
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

  async getTemplateMasterById(id: string): Promise<ITemplateDetailSchema> {
    const template = await this.docusignTemplateMasterModel.findById(id).lean();

    if (!template) {
      throw ApplicationException.NotFoundStatus('Template Master', id);
    }

    const recipientRoles = await this.signerRoleMasterModel
      .find({
        _id: {
          $in: template.recipientRoles,
        },
      })
      .lean();

    return {
      ...template,
      id,
      recipientRoles,
    };
  }

  async getTemplatesMaster(): Promise<OperationResult<GetTemplateMasterDto>> {
    const res = await this.docusignTemplateMasterModel.find().lean();
    const templateMasters = await Promise.all(
      res.map(async item => {
        const recipientRoles = await this.signerRoleMasterModel.find({
          _id: {
            $in: item.recipientRoles.map(Types.ObjectId),
          },
        });

        return {
          ...item,
          recipientRoles,
        };
      }),
    );
    return OperationResult.ok(
      strictPlainToClass(GetTemplateMasterDto, {
        templateMasters,
      }),
    );
  }

  async getSignerRoleMasters(): Promise<OperationResult<GetSignerRoleMasterDto>> {
    const recipientRoles = await this.signerRoleMasterModel.find().lean();
    return OperationResult.ok(strictPlainToClass(GetSignerRoleMasterDto, { recipientRoles }));
  }

  async saveTemplate(req: SaveTemplateReqDto): Promise<OperationResult<SaveTemplateDto>> {
    if (req.mode === SAVE_TEMPLATE_MODE.NEW && req.templateData.id != null) {
      return OperationResult.ok(
        strictPlainToClass(SaveTemplateDto, {
          responseStatus: 'INVALID_MODE_PARAMETER',
        }),
      );
    }

    if (req.mode === SAVE_TEMPLATE_MODE.UPDATE && req.templateData.id == null) {
      return OperationResult.ok(
        strictPlainToClass(SaveTemplateDto, {
          responseStatus: 'INVALID_MODE_PARAMETER',
        }),
      );
    }

    // const recipientRoles = (
    //   await Promise.all(req.templateData.recipientRoles.map(id => this.signerRoleMasterModel.findById(id)))
    // ).map(item => ({ id: item._id, role_name: item.role_name, role_description: item.role_description }));

    const recipientRoles = await this.signerRoleMasterModel
      .find({
        _id: {
          $in: req.templateData.recipientRoles.map(Types.ObjectId),
        },
      })
      .lean();

    const model = await this.docusignTemplateMasterModel
      .findOneAndUpdate(
        { _id: req.templateData.id || Types.ObjectId() },
        {
          ...req.templateData,
          createdAt: new Date(),
        },
        { new: true, upsert: true },
      )
      .lean();

    const payload = { ...model, recipientRoles };
    return OperationResult.ok(
      strictPlainToClass(SaveTemplateDto, {
        responseStatus: 'SUCCESS',
        newUpdatedTemplateMaster: { ...model, recipientRoles },
      }),
    );
  }

  async getContractCompositeTemplates(isChangeOrder?: boolean): Promise<OperationResult<GetContractCompositeTemplateDto>> {
    const query = isChangeOrder === undefined ? {} : { isApplicableForChangeOrders: isChangeOrder };
    const compositeTemplate = await this.docusignCompositeTemplateMasterModel.find(query).lean();

    const compositeTemplates = (await Promise.all(
      compositeTemplate.map(async item => {
        const docusignTemplates = await Promise.all(
          item.docusignTemplateIds.map(async templateId => {
            const template = await this.docusignTemplateMasterModel.findById(templateId).lean();
            if (!template) {
              return [];
            }

            const roles = await Promise.all(
              template.recipientRoles.map(roleId => this.signerRoleMasterModel.findById(roleId).lean()),
            );

            return {
              ...template,
              recipientRoles: roles,
            };
          }),
        );

        return {
          templateDetails: docusignTemplates as any,
          compositeTemplateData: item,
        } as ICompositeTemplateResDto;
      }),
    )) as ICompositeTemplateResDto[];

    return OperationResult.ok(strictPlainToClass(GetContractCompositeTemplateDto, { compositeTemplates }));
  }

  async getContractApplicabilityData(): Promise<OperationResult<GetContractApplicabilityDataDto>> {
    const [utilitiesMaster, utilityProgramsMaster, fundingSources] = await Promise.all([
      this.utilityMasterModel.find().lean(),
      this.utilityProgramMasterService.getAll(),
      this.fundingSourceService.getAll(),
    ]);

    return OperationResult.ok(
      strictPlainToClass(GetContractApplicabilityDataDto, {
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
      return OperationResult.ok(
        strictPlainToClass(SaveContractCompositeTemplateDto, { responseStatus: 'INVALID_MODE_PARAMETER' }),
      );
    }

    if (req.mode === SAVE_TEMPLATE_MODE.UPDATE && req.compositeTemplateData.id == null) {
      return OperationResult.ok(
        strictPlainToClass(SaveContractCompositeTemplateDto, { responseStatus: 'INVALID_MODE_PARAMETER' }),
      );
    }

    const model = await this.docusignCompositeTemplateMasterModel
      .findOneAndUpdate(
        { _id: req.compositeTemplateData.id || Types.ObjectId() },
        {
          name: req.compositeTemplateData.name,
          description: req.compositeTemplateData.description,
          docusignTemplateIds: req.compositeTemplateData.docusignTemplateIds,
          isApplicableForChangeOrders: req.compositeTemplateData.isApplicableForChangeOrders,
          applicableFundingSources: req.compositeTemplateData.applicableFundingSources,
          applicableUtilityPrograms: req.compositeTemplateData.applicableUtilityPrograms,
          applicableUtilities: req.compositeTemplateData.applicableUtilities,
          applicableStates: req.compositeTemplateData.applicableStates,
          applicableSystemTypes: req.compositeTemplateData.applicableSystemTypes,
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

        const recipientRoles = await Promise.all(
          template.recipientRoles.map(roleId => this.signerRoleMasterModel.findById(roleId).lean()),
        );

        return {
          ...template,
          id: template._id,
          recipientRoles,
        };
      }),
    );

    return OperationResult.ok(
      strictPlainToClass(SaveContractCompositeTemplateDto, {
        responseStatus: 'SUCCESS',
        newUpdatedCompositeTemplate: {
          templateDetails: docusignTemplates,
          compositeTemplateData: model,
        },
      }),
    );
  }

  // ===================== INTERNAL =====================

  async countByOpportunityId(opportunityId: string): Promise<number> {
    const res = await this.docusignTemplateMasterModel.countDocuments({ opportunityId });
    return res;
  }

  async getUtilityMaster(utilityName: string): Promise<LeanDocument<UtilityMaster> | null> {
    const res = await this.utilityMasterModel.findOne({ utilityName }).lean();
    return res;
  }

  async getDocusignCompositeTemplateMaster(
    fundingSources: string[],
    utilities: string[],
    utilityPrograms: string[],
  ): Promise<LeanDocument<DocusignCompositeTemplateMaster>[]> {
    const res = await this.docusignCompositeTemplateMasterModel
      .find({
        applicableFundingSources: { $in: fundingSources },
        applicableUtilities: { $in: utilities },
        applicableUtilityPrograms: { $in: utilityPrograms },
      })
      .lean();

    return res;
  }

  async getCompositeTemplateById(
    compositeTemplateId: string,
  ): Promise<{ templateDetails: any; compositeTemplateData: any }> {
    const compositeTemplate = await this.docusignCompositeTemplateMasterModel.findById(compositeTemplateId);

    const docusignTemplates =
      compositeTemplate &&
      (await Promise.all(
        compositeTemplate.docusignTemplateIds?.map(async templateId => {
          const template = await this.docusignTemplateMasterModel.findById(templateId);
          if (!template) {
            return [];
          }
          const roles = await Promise.all(
            template.recipientRoles.map(roleId => this.signerRoleMasterModel.findById(roleId)),
          );

          const templateObj = template.toJSON();

          return {
            ...templateObj,
            id: template._id.toString(),
            recipientRoles: roles?.map(role => role?.toJSON({ versionKey: false })),
          };
        }),
      ));

    return {
      templateDetails: docusignTemplates,
      compositeTemplateData: compositeTemplate?.toJSON({ versionKey: false }),
    };
  }

  public async getSignerRoleMasterByRoleName(roleName: string): Promise<LeanDocument<SignerRoleMaster> | null> {
    const found = await this.signerRoleMasterModel
      .findOne({
        roleName,
      })
      .lean();

    return found;
  }
  // ===================== INTERNAL =====================
}

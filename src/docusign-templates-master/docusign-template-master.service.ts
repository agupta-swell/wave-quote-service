/* eslint-disable no-plusplus */
import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, ObjectId, Types } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from 'src/app/common';
import { CONTRACT_TYPE } from 'src/contracts/constants';
import { ITemplateDetailSchema } from 'src/contracts/contract.schema';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { UtilityProgramMasterService } from 'src/utility-programs-master/utility-program-master.service';
import { FinancierService } from 'src/financiers/financier.service';
import { FinancialProductsService } from 'src/financial-products/financial-product.service';
import { SAVE_TEMPLATE_MODE, SYSTEM_TYPE } from './constants';
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
    private readonly financierService: FinancierService,
    private readonly financialProductsService: FinancialProductsService,
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

    return OperationResult.ok(
      strictPlainToClass(SaveTemplateDto, {
        responseStatus: 'SUCCESS',
        newUpdatedTemplateMaster: { ...model, recipientRoles },
      }),
    );
  }

  async getContractCompositeTemplates(type?: CONTRACT_TYPE): Promise<OperationResult<GetContractCompositeTemplateDto>> {
    const query = type === undefined ? {} : { type };

    const [signerRoles, compositeTemplate] = await Promise.all([
      this.signerRoleMasterModel.find().lean(),
      this.docusignCompositeTemplateMasterModel.find(query).lean(),
    ]);

    const signerRolesMap = new Map<string, LeanDocument<SignerRoleMaster>>(
      signerRoles.map(signerRole => [signerRole._id.toString(), signerRole]),
    );

    const compositeTemplates = (await Promise.all(
      compositeTemplate.map(async item => {
        const templates = await this.docusignTemplateMasterModel
          .find({
            _id: {
              $in: item.docusignTemplateIds,
            },
          })
          .lean();

        const docusignTemplates = await Promise.all(
          templates.map(async template => {
            const recipientRoles = template.recipientRoles.map(roleId => signerRolesMap.get(roleId));

            return {
              ...template,
              compositeTemplateId: item._id.toString(),
              recipientRoles,
            };
          }),
        );

        const sortedDocusignTemplates = item.docusignTemplateIds.map(docusignTemplateId =>
          docusignTemplates.find(docusignTemplate => docusignTemplate._id.toString() === docusignTemplateId),
        );

        return {
          templateDetails: sortedDocusignTemplates as any,
          compositeTemplateData: item,
        } as ICompositeTemplateResDto;
      }),
    )) as ICompositeTemplateResDto[];

    return OperationResult.ok(strictPlainToClass(GetContractCompositeTemplateDto, { compositeTemplates }));
  }

  async getTemplateIdsInCompositeTemplate(
    compositeTemplateId: string,
  ): Promise<{
    id: string;
    filenameForDownloads?: string;
    templates: string[];
    beginPageNumberingTemplateId: string;
  }> {
    const found = await this.docusignCompositeTemplateMasterModel.findById(compositeTemplateId).lean();

    if (!found)
      return {
        id: compositeTemplateId,
        templates: [],
        beginPageNumberingTemplateId: '',
      };

    return {
      id: compositeTemplateId,
      filenameForDownloads: found.filenameForDownloads,
      templates: found.docusignTemplateIds || [],
      beginPageNumberingTemplateId: found.beginPageNumberingTemplateId,
    };
  }

  async getContractApplicabilityData(): Promise<OperationResult<GetContractApplicabilityDataDto>> {
    const [
      utilitiesMaster,
      utilityProgramsMaster,
      fundingSources,
      financiers,
      financialProductTypes,
    ] = await Promise.all([
      this.utilityMasterModel.find().lean(),
      this.utilityProgramMasterService.getAll(),
      this.fundingSourceService.getAll(),
      this.financierService.getAll({ isActive: true }),
      this.financialProductsService.getAll({ isActive: true }),
    ]);

    return OperationResult.ok(
      strictPlainToClass(GetContractApplicabilityDataDto, {
        applicableUtilities: utilitiesMaster,
        applicableFundingSources: fundingSources,
        applicableUtilityPrograms: utilityProgramsMaster,
        applicableFinanciers: financiers,
        applicableFinancialProductTypes: financialProductTypes,
      }),
    );
  }

  async saveContractCompositeTemplate(
    req: SaveContractCompositeTemplateReqDto,
  ): Promise<OperationResult<SaveContractCompositeTemplateDto>> {
    if (req.mode === SAVE_TEMPLATE_MODE.NEW && req.compositeTemplateData.id != null) {
      return OperationResult.ok(
        strictPlainToClass(SaveContractCompositeTemplateDto, {
          responseStatus: 'Create Contract Composite Template does not accept id',
        }),
      );
    }

    if (req.mode === SAVE_TEMPLATE_MODE.UPDATE && req.compositeTemplateData.id == null) {
      return OperationResult.ok(
        strictPlainToClass(SaveContractCompositeTemplateDto, {
          responseStatus: 'Update Contract Composite Template requires an id',
        }),
      );
    }

    if (
      (req.compositeTemplateData.type === CONTRACT_TYPE.PRIMARY_CONTRACT ||
        req.compositeTemplateData.type === CONTRACT_TYPE.GRID_SERVICES_PACKET) &&
      !req.compositeTemplateData.filenameForDownloads
    ) {
      throw new BadRequestException('Filename for Downloads is required');
    }

    const model = await this.docusignCompositeTemplateMasterModel
      .findOneAndUpdate(
        { _id: req.compositeTemplateData.id || Types.ObjectId() },
        {
          name: req.compositeTemplateData.name,
          description: req.compositeTemplateData.description,
          docusignTemplateIds: req.compositeTemplateData.docusignTemplateIds,
          type: req.compositeTemplateData.type,
          filenameForDownloads: req.compositeTemplateData.filenameForDownloads,
          applicableRebatePrograms: req.compositeTemplateData.applicableRebatePrograms,
          applicableFundingSources: req.compositeTemplateData.applicableFundingSources,
          applicableFinanciers: req.compositeTemplateData.applicableFinanciers,
          applicableFinancialProductTypes: req.compositeTemplateData.applicableFinancialProductTypes,
          applicableUtilityPrograms: req.compositeTemplateData.applicableUtilityPrograms,
          applicableUtilities: req.compositeTemplateData.applicableUtilities,
          applicableStates: req.compositeTemplateData.applicableStates,
          applicableSystemTypes: req.compositeTemplateData.applicableSystemTypes,
          beginPageNumberingTemplateId: req.compositeTemplateData.beginPageNumberingTemplateId,
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
    financiers: string[],
    financialProducts: string[],
    utilities: string[],
    utilityPrograms: (string | null)[],
    applicableSystemTypes: SYSTEM_TYPE[],
  ): Promise<LeanDocument<DocusignCompositeTemplateMaster>[]> {
    const res = await this.docusignCompositeTemplateMasterModel
      .find(<any>{
        type: { $ne: CONTRACT_TYPE.GRID_SERVICES_PACKET },
        applicableFundingSources: { $in: fundingSources },
        applicableFinanciers: { $in: financiers },
        applicableFinancialProductTypes: { $in: financialProducts },
        applicableUtilities: { $in: utilities },
        applicableUtilityPrograms: { $in: utilityPrograms },
        applicableSystemTypes: { $in: applicableSystemTypes },
      })
      .lean();

    return res;
  }

  async getDocusignCompositeTemplateMasterForGSA(
    utilityPrograms: (string | null)[],
    rebatePrograms: (string | null)[],
  ): Promise<LeanDocument<DocusignCompositeTemplateMaster>[]> {
    const res = await this.docusignCompositeTemplateMasterModel
      .find({
        type: CONTRACT_TYPE.GRID_SERVICES_PACKET,
        applicableUtilityPrograms: { $in: utilityPrograms },
        applicableRebatePrograms: { $in: rebatePrograms },
      })
      .lean();

    return res;
  }

  async getCompositeTemplateById(
    compositeTemplateId: string,
  ): Promise<{
    templateDetails: (Omit<LeanDocument<DocusignTemplateMaster>, 'recipientRoles'> & {
      recipientRoles: LeanDocument<SignerRoleMaster>[];
    })[];
    compositeTemplateData: LeanDocument<DocusignCompositeTemplateMaster> | null;
  }> {
    const compositeTemplate = await this.docusignCompositeTemplateMasterModel.findById(compositeTemplateId);

    if (!compositeTemplate) {
      throw new HttpException('Composite Template not found', HttpStatus.NOT_FOUND);
    }

    const docusignTemplates = await Promise.all(
      compositeTemplate.docusignTemplateIds?.map(async templateId => {
        const template = await this.docusignTemplateMasterModel.findById(templateId);
        if (!template) {
          console.error('Can not find templateId', templateId);
          throw new HttpException('Some Individual Templates are missing', HttpStatus.NOT_FOUND);
        }

        const roles = await Promise.all(
          template.recipientRoles.map(async roleId => {
            const role = await this.signerRoleMasterModel.findById(roleId);
            if (!role) {
              console.error('Can not find roleId', roleId);
              throw new HttpException('Some roles are missing', HttpStatus.NOT_FOUND);
            }
            return role;
          }),
        );

        const templateObj = template.toJSON();

        return {
          ...templateObj,
          id: template._id.toString(),
          recipientRoles: roles.map(role => role.toJSON({ versionKey: false })),
        };
      }),
    );

    return {
      templateDetails: docusignTemplates,
      compositeTemplateData: compositeTemplate?.toJSON({ versionKey: false }) || null,
    };
  }

  async getCustomGSPTemplates(
    customGSPTemplates: string[],
    customGSPBeginPageNumberingTemplateId: string,
  ): Promise<{
    templateDetails: (Omit<LeanDocument<DocusignTemplateMaster>, 'recipientRoles'> & {
      recipientRoles: LeanDocument<SignerRoleMaster>[];
    })[];
    compositeTemplateData: {
      docusignTemplateIds: string[];
      beginPageNumberingTemplateId: string;
    };
  }> {
    const docusignTemplates = await Promise.all(
      customGSPTemplates.map(async templateId => {
        const template = await this.docusignTemplateMasterModel.findById(templateId);
        if (!template) {
          console.error('Can not find templateId', templateId);
          throw new HttpException('Some Individual Templates are missing', HttpStatus.NOT_FOUND);
        }

        const roles = await Promise.all(
          template.recipientRoles.map(async roleId => {
            const role = await this.signerRoleMasterModel.findById(roleId);
            if (!role) {
              console.error('Can not find roleId', roleId);
              throw new HttpException('Some roles are missing', HttpStatus.NOT_FOUND);
            }
            return role;
          }),
        );

        const templateObj = template.toJSON();

        return {
          ...templateObj,
          id: template._id.toString(),
          recipientRoles: roles.map(role => role.toJSON({ versionKey: false })),
        };
      }),
    );

    return {
      templateDetails: docusignTemplates,
      compositeTemplateData: {
        docusignTemplateIds: customGSPTemplates,
        beginPageNumberingTemplateId: customGSPBeginPageNumberingTemplateId,
      },
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

  public async deleteTemplateById(id: ObjectId): Promise<void> {
    const found = await this.docusignTemplateMasterModel.findOne({ _id: id });

    if (!found) {
      throw new NotFoundException(`No template found with id ${id.toString()}`);
    }

    await found.delete();
  }

  public async deleteCompositeTemplateById(id: ObjectId): Promise<void> {
    const found = await this.docusignCompositeTemplateMasterModel.findOne({ _id: id });

    if (!found) {
      throw new NotFoundException(`No template found with id ${id.toString()}`);
    }

    await found.delete();
  }
}

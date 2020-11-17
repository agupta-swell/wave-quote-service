import { ApplicationException } from '../app/app.exception';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult, Pagination } from '../app/common';
import { toSnakeCase } from '../utils/transformProperties';
import { ProposalTemplate, PROPOSAL_TEMPLATE } from './proposal-template.schema';
import { CreateProposalTemplateDto } from './req/create-proposal-template.dto';
import { UpdateProposalTemplateDto } from './req/update-proposal-template.dto';
import { ProposalTemplateDto } from './res/proposal-template.dto';
import { ProposalSectionMasterService } from '../proposal-section-masters/proposal-section-masters.service';

@Injectable()
export class ProposalTemplateService {
  constructor(
    @InjectModel(PROPOSAL_TEMPLATE) private proposalTemplate: Model<ProposalTemplate>,
    private readonly proposalSectionMasterService: ProposalSectionMasterService,
  ) {}

  async create(proposalTemplateDto: CreateProposalTemplateDto): Promise<OperationResult<ProposalTemplateDto>> {
    const proposalSections = await Promise.all(
      proposalTemplateDto.sections.map(id => this.proposalSectionMasterService.getProposalSectionMasterById(id)),
    );

    const model = new this.proposalTemplate({
      name: proposalTemplateDto.name,
      sections: proposalSections.map(item => ({
        id: item._id,
        name: item.name,
        component_name: item.component_name,
      })),
      proposal_section_master: toSnakeCase(proposalTemplateDto.proposalSectionMaster),
    });
    await model.save();
    return OperationResult.ok(new ProposalTemplateDto(model.toObject()));
  }

  async update(
    id: string,
    proposalTemplateDto: UpdateProposalTemplateDto,
  ): Promise<OperationResult<ProposalTemplateDto>> {
    const foundProposalSectionMaster = await this.proposalTemplate.findOne({ _id: id });
    if (!foundProposalSectionMaster) {
      throw ApplicationException.EnitityNotFound(id);
    }

    const proposalSections = proposalTemplateDto.sections
      ? await Promise.all(
          proposalTemplateDto?.sections?.map(id => this.proposalSectionMasterService.getProposalSectionMasterById(id)),
        )
      : [];

    const updatedModel = await this.proposalTemplate.findByIdAndUpdate(
      id,
      {
        name: proposalTemplateDto.name || foundProposalSectionMaster.name,
        sections: proposalSections.length
          ? proposalSections.map(item => ({
              id: item._id,
              name: item.name,
              component_name: item.component_name,
            }))
          : foundProposalSectionMaster.sections,
        proposal_section_master: proposalTemplateDto.proposalSectionMaster
          ? toSnakeCase(proposalTemplateDto.proposalSectionMaster)
          : foundProposalSectionMaster.proposal_section_master,
      },
      { new: true },
    );

    return OperationResult.ok(new ProposalTemplateDto(updatedModel.toObject()));
  }

  async getList(limit: number, skip: number): Promise<OperationResult<Pagination<ProposalTemplateDto>>> {
    const [proposalTemplates, total] = await Promise.all([
      this.proposalTemplate.find().limit(limit).skip(skip),
      this.proposalTemplate.estimatedDocumentCount(),
    ]);

    return OperationResult.ok({
      data: proposalTemplates.map(proposalTemplate => new ProposalTemplateDto(proposalTemplate.toObject())),
      total,
    });
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getOneById(proposalTemplateId: string): Promise<ProposalTemplate> {
    const res = await this.proposalTemplate.findById(proposalTemplateId);
    return res?.toObject() || {};
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApplicationException } from '../app/app.exception';
import { OperationResult, Pagination } from '../app/common';
import { ProposalSectionMasterService } from '../proposal-section-masters/proposal-section-masters.service';
import { Proposal, PROPOSAL } from './proposal.schema';
import { CreateProposalDto } from './req/create-proposal.dto';
import { UpdateProposalDto } from './req/update-proposal.dto';
import { ProposalDto } from './res/proposal.dto';

@Injectable()
export class ProposalService {
  constructor(
    @InjectModel(PROPOSAL) private proposalTemplate: Model<Proposal>,
    private readonly proposalSectionMasterService: ProposalSectionMasterService,
  ) {}

  async create(proposalTemplateDto: CreateProposalDto): Promise<OperationResult<ProposalDto>> {
    const proposalSections = await Promise.all(
      proposalTemplateDto.sections.map(id => this.proposalSectionMasterService.getProposalSectionMasterById(id)),
    );

    const model = new this.proposalTemplate({
      name: proposalTemplateDto.name,
      sections: proposalSections.map(item => ({
        id: item._id,
        name: item.proposal_section_name,
        component_name: item.component_name,
      })),
    });
    await model.save();
    return OperationResult.ok(new ProposalDto(model.toObject()));
  }

  async update(id: string, proposalTemplateDto: UpdateProposalDto): Promise<OperationResult<ProposalDto>> {
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
              name: item.proposal_section_name,
              component_name: item.component_name,
            }))
          : foundProposalSectionMaster.sections,
      },
      { new: true },
    );

    return OperationResult.ok(new ProposalDto(updatedModel.toObject()));
  }

  async getList(limit: number, skip: number): Promise<OperationResult<Pagination<ProposalDto>>> {
    const [proposalTemplates, total] = await Promise.all([
      this.proposalTemplate.find().limit(limit).skip(skip),
      this.proposalTemplate.estimatedDocumentCount(),
    ]);

    return OperationResult.ok({
      data: proposalTemplates.map(proposalTemplate => new ProposalDto(proposalTemplate.toObject())),
      total,
    });
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-
}

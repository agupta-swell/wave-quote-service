import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult, Pagination } from '../app/common';
import { Proposal, PROPOSAL } from './proposal.schema';
import { CreateProposalDto } from './req/create-proposal.dto';
import { UpdateProposalDto } from './req/update-proposal.dto';
import { ProposalDto } from './res/proposal.dto';

@Injectable()
export class ProposalService {
  constructor(@InjectModel(PROPOSAL) private proposal: Model<Proposal>) {}

  async create(proposalDto: CreateProposalDto): Promise<OperationResult<ProposalDto>> {
    const model = new this.proposal({
      opportunity_id: proposalDto.opportunityId,
    });
    await model.save();
    return OperationResult.ok(new ProposalDto(model.toObject()));
  }

  async update(id: string, proposalTemplateDto: UpdateProposalDto): Promise<OperationResult<ProposalDto>> {
    return;
    // return OperationResult.ok(new ProposalDto(updatedModel.toObject()));
  }

  async getList(limit: number, skip: number): Promise<OperationResult<Pagination<ProposalDto>>> {
    const [proposalTemplates, total] = await Promise.all([
      this.proposal.find().limit(limit).skip(skip),
      this.proposal.estimatedDocumentCount(),
    ]);

    return OperationResult.ok({
      data: proposalTemplates.map(proposalTemplate => new ProposalDto(proposalTemplate.toObject())),
      total,
    });
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-
}

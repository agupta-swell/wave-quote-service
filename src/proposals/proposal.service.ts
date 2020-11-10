import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { identity, pickBy } from 'lodash';
import { Model } from 'mongoose';
import { OperationResult, Pagination } from '../app/common';
import { SystemDesignService } from '../system-designs/system-design.service';
import { ApplicationException } from './../app/app.exception';
import { QuoteService } from './../quotes/quote.service';
import { PROPOSAL_STATUS } from './constants';
import { IDetailedProposalSchema, Proposal, PROPOSAL } from './proposal.schema';
import { CreateProposalDto } from './req/create-proposal.dto';
import { UpdateProposalDto } from './req/update-proposal.dto';
import { ProposalDto } from './res/proposal.dto';

@Injectable()
export class ProposalService {
  constructor(
    @InjectModel(PROPOSAL) private proposalModel: Model<Proposal>,
    private readonly systemDesignService: SystemDesignService,
    private readonly quoteService: QuoteService,
  ) {}

  async create(proposalDto: CreateProposalDto): Promise<OperationResult<ProposalDto>> {
    const model = new this.proposalModel({
      opportunity_id: proposalDto.opportunityId,
    });
    await model.save();
    return OperationResult.ok(new ProposalDto(model.toObject()));
  }

  async update(id: string, proposalDto: UpdateProposalDto): Promise<OperationResult<ProposalDto>> {
    const foundProposal = await this.proposalModel.findById(id);

    if (!foundProposal) {
      throw ApplicationException.EnitityNotFound(id);
    }

    const newData = {
      detailed_proposal: {} as IDetailedProposalSchema,
    } as Proposal;

    const { detailedProposal } = proposalDto;

    if (detailedProposal.isSelected) {
      newData.detailed_proposal.is_selected = detailedProposal.isSelected;
    }

    if (detailedProposal.proposalName) {
      newData.detailed_proposal.proposal_name = detailedProposal.proposalName;
    }

    if (detailedProposal.proposalValidityPeriod) {
      newData.detailed_proposal.proposal_validity_period = detailedProposal.proposalValidityPeriod;
    }

    if (detailedProposal.recipients) {
      newData.detailed_proposal.recipients = detailedProposal.recipients;
    }

    if (detailedProposal.templateId) {
      newData.detailed_proposal.template_id = detailedProposal.templateId;
    }

    if (!foundProposal.detailed_proposal) {
      newData.system_design_id = proposalDto.systemDesignId;
      newData.quote_id = proposalDto.quoteId;
      newData.detailed_proposal.proposal_creation_date = new Date();
      newData.detailed_proposal.status = PROPOSAL_STATUS.CREATED;
      const [systemDesign, detailedQuote] = await Promise.all([
        this.systemDesignService.getOneById(proposalDto.opportunityId),
        this.quoteService.getOneById(proposalDto.quoteId),
      ]);
      newData.detailed_proposal.system_design_data = systemDesign;
      newData.detailed_proposal.quote_data = detailedQuote;
    }

    const updatedModel = await this.proposalModel.findByIdAndUpdate(id, newData, { new: true });
    return OperationResult.ok(new ProposalDto(updatedModel.toObject()));
  }

  async getList(
    limit: number,
    skip: number,
    quoteId: string,
    opportunityId: string,
  ): Promise<OperationResult<Pagination<ProposalDto>>> {
    const condition = pickBy(
      {
        quote_id: quoteId,
        opportunity_id: opportunityId,
      },
      identity,
    );

    const [proposals, total] = await Promise.all([
      this.proposalModel.find(condition).limit(limit).skip(skip),
      this.proposalModel.countDocuments(condition),
    ]);

    return OperationResult.ok({
      data: proposals.map(proposal => new ProposalDto(proposal.toObject())),
      total,
    });
  }

  async getProposalDetails(id: string): Promise<OperationResult<ProposalDto>> {
    const proposal = await this.proposalModel.findById(id);
    if (!proposal) {
      throw ApplicationException.EnitityNotFound(id);
    }

    return OperationResult.ok(new ProposalDto(proposal.toObject()));
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-
}

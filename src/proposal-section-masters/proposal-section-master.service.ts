import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { identity, pickBy } from 'lodash';
import { LeanDocument, Model } from 'mongoose';
import { ApplicationException } from '../app/app.exception';
import { OperationResult, Pagination } from '../app/common';
import { toSnakeCase } from '../utils/transformProperties';
import { ProposalSectionMaster, PROPOSAL_SECTION_MASTER } from './proposal-section-master.schema';
import { CreateProposalSectionMasterDto } from './req/create-proposal-section-master.dto';
import { UpdateProposalSectionMasterDto } from './req/update-proposal-section-master.dto';
import { ProposalSectionMasterDto } from './res/proposal-section-master.dto';

@Injectable()
export class ProposalSectionMasterService {
  constructor(@InjectModel(PROPOSAL_SECTION_MASTER) private proposalSectionMaster: Model<ProposalSectionMaster>) {}

  async create(
    proposalSectionMasterDto: CreateProposalSectionMasterDto,
  ): Promise<OperationResult<ProposalSectionMasterDto>> {
    const model = new this.proposalSectionMaster({ ...toSnakeCase(proposalSectionMasterDto) });
    await model.save();
    return OperationResult.ok(new ProposalSectionMasterDto(model.toObject()));
  }

  async update(
    id: string,
    proposalSectionMasterDto: UpdateProposalSectionMasterDto,
  ): Promise<OperationResult<ProposalSectionMasterDto>> {
    const foundProposalSectionMaster = await this.proposalSectionMaster.findOne({ _id: id }).lean();
    if (!foundProposalSectionMaster) {
      throw ApplicationException.EnitityNotFound(id);
    }

    const updatedModel = await this.proposalSectionMaster
      .findByIdAndUpdate(
        id,
        {
          ...toSnakeCase(proposalSectionMasterDto),
        },
        { new: true },
      )
      .lean();

    return OperationResult.ok(new ProposalSectionMasterDto(updatedModel || ({} as any)));
  }

  async getList(
    limit: number,
    skip: number,
    products: string[],
    financialProducts: string[],
  ): Promise<OperationResult<Pagination<ProposalSectionMasterDto>>> {
    const condition = pickBy(
      {
        applicable_products: { $in: ['all', ...(products || [])] },
        applicable_financial_products: { $in: ['all', ...(financialProducts || [])] },
      },
      identity,
    );

    const [proposalSectionMasters, total] = await Promise.all([
      this.proposalSectionMaster.find(condition).limit(limit).skip(skip).lean(),
      this.proposalSectionMaster.countDocuments(condition),
    ]);

    return OperationResult.ok(
      new Pagination({
        data: proposalSectionMasters.map(proposalSectionMaster => new ProposalSectionMasterDto(proposalSectionMaster)),
        total,
      }),
    );
  }
  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getProposalSectionMasterById(id: string): Promise<LeanDocument<ProposalSectionMaster> | null> {
    const found = await this.proposalSectionMaster.findById(id).lean();
    return found;
  }
}

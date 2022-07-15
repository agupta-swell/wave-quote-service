import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { identity, pickBy } from 'lodash';
import { LeanDocument, Model, ObjectId, Types } from 'mongoose';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { ApplicationException } from '../app/app.exception';
import { OperationResult, Pagination } from '../app/common';
import { ProposalSectionMaster, PROPOSAL_SECTIONS_MASTER_COLL } from './proposal-section-master.schema';
import { GetAllProposalSectionsMasterQuery } from './req';
import { CreateProposalSectionMasterDto } from './req/create-proposal-section-master.dto';
import { UpdateProposalSectionMasterDto } from './req/update-proposal-section-master.dto';
import { ProposalSectionMasterDto } from './res/proposal-section-master.dto';

@Injectable()
export class ProposalSectionMasterService {
  constructor(
    @InjectModel(PROPOSAL_SECTIONS_MASTER_COLL) private proposalSectionMaster: Model<ProposalSectionMaster>,
  ) {}

  async create(
    proposalSectionMasterDto: CreateProposalSectionMasterDto,
  ): Promise<OperationResult<ProposalSectionMasterDto>> {
    const model = new this.proposalSectionMaster(proposalSectionMasterDto);
    await model.save();
    return OperationResult.ok(strictPlainToClass(ProposalSectionMasterDto, model.toJSON()));
  }

  async update(
    id: ObjectId,
    proposalSectionMasterDto: UpdateProposalSectionMasterDto,
  ): Promise<OperationResult<ProposalSectionMasterDto>> {
    const foundProposalSectionMaster = await this.proposalSectionMaster.findOne({ _id: id }).lean();
    if (!foundProposalSectionMaster) {
      throw ApplicationException.EntityNotFound(id.toString());
    }

    const updatedModel = await this.proposalSectionMaster
      .findByIdAndUpdate(
        id,
        {
          ...proposalSectionMasterDto,
        },
        { new: true },
      )
      .lean();

    return OperationResult.ok(strictPlainToClass(ProposalSectionMasterDto, updatedModel));
  }

  async getList(
    req: GetAllProposalSectionsMasterQuery,
  ): Promise<OperationResult<Pagination<ProposalSectionMasterDto>>> {
    const { fundingSources, limit, quoteTypes, skip } = req;

    const condition = pickBy(
      {
        applicableQuoteTypes: { $in: ['all', ...(quoteTypes || [])] },
        applicableFundingSources: { $in: ['all', ...(fundingSources || [])] },
      },
      identity,
    );

    const [proposalSectionMasters, total] = await Promise.all([
      this.proposalSectionMaster.find(condition).limit(limit).skip(skip).lean(),
      this.proposalSectionMaster.countDocuments(condition),
    ]);

    return OperationResult.ok(
      new Pagination({
        data: strictPlainToClass(ProposalSectionMasterDto, proposalSectionMasters),
        total,
      }),
    );
  }
  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getProposalSectionMasterById(id: string): Promise<LeanDocument<ProposalSectionMaster> | null> {
    const found = await this.proposalSectionMaster.findById(id).lean();
    return found;
  }

  async getProposalSectionMastersByIds(ids: string[]): Promise<LeanDocument<ProposalSectionMaster>[] | null> {
    const founds = await this.proposalSectionMaster
      .find({
        _id: {
          $in: ids.map(Types.ObjectId),
        },
      })
      .lean();

    return ids.map(id => {
      const doc = founds.find(doc => doc._id.toString() === id);

      if (!doc) {
        throw ApplicationException.EntityNotFound(`with proposalSectionMaster ${id} `);
      }

      return doc;
    });
  }
}

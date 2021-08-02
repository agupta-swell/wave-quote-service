import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
// import { ApplicationException } from 'src/app/app.exception';
import { ApplicationException } from 'src/app/app.exception';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { OperationResult, Pagination } from '../app/common';
import { RebateProgramDto } from './res/reabate-program.dto';
import { RebateProgram, REBATE_PROGRAM } from './rebate-programs.schema';

@Injectable()
export class RebateProgramService {
  constructor(
    @InjectModel(REBATE_PROGRAM) private rebateProgram: Model<RebateProgram>,
    @Inject(forwardRef(() => OpportunityService))
    private readonly opportunityService: OpportunityService,
  ) {}

  async getList(): Promise<OperationResult<Pagination<RebateProgramDto>>> {
    const [rebatePrograms, total] = await Promise.all([
      this.rebateProgram.find(),
      this.rebateProgram.estimatedDocumentCount(),
    ]);

    return OperationResult.ok(new Pagination({ data: rebatePrograms.map(item => new RebateProgramDto(item)), total }));
  }

  async findByOpportunityId(opportunityId: string): Promise<LeanDocument<RebateProgram>[]> {
    const opportunity = await this.opportunityService.getDetailById(opportunityId);

    if (!opportunity) {
      throw ApplicationException.EntityNotFound('Opportunity');
    }

    if (!opportunity.rebateProgramId) return [];

    // return LeanDocument<RebateProgram>[] for future implementation of multiple rebase programs per opp
    return this.rebateProgram.find({ _id: opportunity.rebateProgramId }).lean();
  }
}

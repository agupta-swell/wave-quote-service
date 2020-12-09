import { QualificationService } from '../qualifications/qualification.service';
import { Injectable } from '@nestjs/common';
import { ProposalService } from 'src/proposals/proposal.service';
import { QuoteService } from 'src/quotes/quote.service';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { OperationResult } from './../app/common/operation-result';
import { UtilityService } from './../utilities/utility.service';
import { ProgressDto } from './res/progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    private readonly utilityService: UtilityService,
    private readonly systemDesignSerivce: SystemDesignService,
    private readonly quoteService: QuoteService,
    private readonly proposalService: ProposalService,
    private readonly qualificationService: QualificationService,
  ) {}

  async countEachProgress(opportunityId: string): Promise<OperationResult<ProgressDto>> {
    const [
      utilityCounter = 0,
      systemDesignCounter = 0,
      quoteCounter = 0,
      proposalCounter = 0,
      qualificationCounter = 0,
    ] = await Promise.all([
      this.utilityService.countByOpportunityId(opportunityId),
      this.systemDesignSerivce.countByOpportunityId(opportunityId),
      this.quoteService.countByOpportunityId(opportunityId),
      this.proposalService.countByOpportunityId(opportunityId),
      this.qualificationService.countByOpportunityId(opportunityId),
    ]);

    return OperationResult.ok(
      new ProgressDto({
        utilityAndUsageCounter: utilityCounter,
        systemDesignCounter,
        quoteCounter,
        proposalCounter,
        qualificationCounter,
      }),
    );
  }
}

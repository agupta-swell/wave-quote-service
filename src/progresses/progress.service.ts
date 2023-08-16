import { Injectable } from '@nestjs/common';
import { ProposalService } from 'src/proposals/proposal.service';
import { QuoteService } from 'src/quotes/quote.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { OperationResult } from '../app/common/operation-result';
import { QualificationService } from '../qualifications/qualification.service';
import { UtilityService } from '../utilities/utility.service';
import { ProgressDto } from './res/progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    private readonly utilityService: UtilityService,
    private readonly systemDesignService: SystemDesignService,
    private readonly quoteService: QuoteService,
    private readonly proposalService: ProposalService,
    private readonly qualificationService: QualificationService,
  ) {}

  async countEachProgress(opportunityId: string): Promise<OperationResult<ProgressDto>> {
    const [
      utilityCounter,
      systemDesignCounter,
      quoteCounter,
      quoteCounterForEnablingQualificationTab,
      proposalCounter,
      qualificationCounter,
    ] = await Promise.all([
      this.utilityService.countByOpportunityId(opportunityId),
      this.systemDesignService.countActiveDocumentsByOpportunityId(opportunityId),
      this.quoteService.countByOpportunityId(opportunityId),
      this.quoteService.countForEnablingQualificationTabByOpportunityId(opportunityId),
      this.proposalService.countByOpportunityId(opportunityId),
      this.qualificationService.countByOpportunityId(opportunityId),
    ]);

    return OperationResult.ok(
      strictPlainToClass(ProgressDto, {
        utilityAndUsageCounter: utilityCounter,
        systemDesignCounter,
        quoteCounter,
        quoteCounterForEnablingQualificationTab,
        proposalCounter,
        qualificationCounter,
      }),
    );
  }
}

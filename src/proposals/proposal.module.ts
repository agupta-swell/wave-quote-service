import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProposalController } from './proposal.controller';
import { PROPOSAL, ProposalSchema } from './proposal.schema';
import { ProposalService } from './proposal.service';
import { PROPOSAL_ANALYTIC, ProposalAnalyticSchema } from './schemas/proposal-analytic.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PROPOSAL,
        schema: ProposalSchema,
        collection: 'v2_proposals',
      },
      {
        name: PROPOSAL_ANALYTIC,
        schema: ProposalAnalyticSchema,
        collection: 'v2_proposal_analytics',
      },
    ]),
  ],
  controllers: [ProposalController],
  providers: [ProposalService],
  exports: [ProposalService],
})
export class ProposalModule {}

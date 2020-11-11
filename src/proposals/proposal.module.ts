import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ProposalController } from './proposal.controller';
import { PROPOSAL, ProposalSchema } from './proposal.schema';
import { ProposalService } from './proposal.service';
import { ProposalAnalyticSchema, PROPOSAL_ANALYTIC } from './schemas/proposal-analytic.schema';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.PROPOSAL_JWT_SECRET,
    }),
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

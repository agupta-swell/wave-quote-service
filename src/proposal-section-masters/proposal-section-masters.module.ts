import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProposalSectionMasterController } from './proposal-section-masters.controller';
import { ProposalSectionMasterSchema, PROPOSAL_SECTION_MASTER } from './proposal-section-masters.schema';
import { ProposalSectionMasterService } from './proposal-section-masters.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PROPOSAL_SECTION_MASTER,
        schema: ProposalSectionMasterSchema,
        collection: 'v2_proposal_section_masters',
      },
    ]),
  ],
  controllers: [ProposalSectionMasterController],
  providers: [ProposalSectionMasterService],
  exports: [ProposalSectionMasterService],
})
export class ProposalSectionMasterModule {}

import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { ProposalSectionMasterController } from './proposal-section-master.controller';
import { ProposalSectionMasterSchema, PROPOSAL_SECTIONS_MASTER_COLL } from './proposal-section-master.schema';
import { ProposalSectionMasterService } from './proposal-section-master.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: PROPOSAL_SECTIONS_MASTER_COLL,
        schema: ProposalSectionMasterSchema,
        collection: PROPOSAL_SECTIONS_MASTER_COLL,
      },
    ]),
  ],
  controllers: [ProposalSectionMasterController],
  providers: [ProposalSectionMasterService],
  exports: [ProposalSectionMasterService],
})
export class ProposalSectionMasterModule {}

import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProposalTemplateController } from './proposal-template.controller';
import { ProposalTemplateSchema, PROPOSAL_TEMPLATE } from './proposal-template.schema';
import { ProposalTemplateService } from './proposal-template.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PROPOSAL_TEMPLATE,
        schema: ProposalTemplateSchema,
        collection: 'proposal_templates',
      },
    ]),
  ],
  controllers: [ProposalTemplateController],
  providers: [ProposalTemplateService],
  exports: [ProposalTemplateService],
})
export class ProposalTemplateModule {}

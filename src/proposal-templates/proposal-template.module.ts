import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { ProposalTemplateController } from './proposal-template.controller';
import { ProposalTemplateSchema, PROPOSAL_TEMPLATE } from './proposal-template.schema';
import { ProposalTemplateService } from './proposal-template.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: PROPOSAL_TEMPLATE,
        schema: ProposalTemplateSchema,
        collection: 'v2_proposal_templates',
      },
    ]),
  ],
  controllers: [ProposalTemplateController],
  providers: [ProposalTemplateService],
  exports: [ProposalTemplateService],
})
export class ProposalTemplateModule {}

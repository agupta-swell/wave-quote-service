import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OPPORTUNITY, OpportunitySchema } from './opportunity.schema';
import { OpportunityService } from './opportunity.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: OPPORTUNITY,
        schema: OpportunitySchema,
        collection: 'opportunities',
      },
    ]),
  ],
  providers: [OpportunityService],
  exports: [OpportunityService],
})
export class OpportunityModule {}

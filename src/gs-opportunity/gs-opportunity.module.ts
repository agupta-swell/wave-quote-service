import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GS_OPPORTUNITY_COLLECTION_NAME } from './constants';
import { GsOpportunitySchema } from './gs-opportunity.schema';
import { GsOpportunityService } from './gs-opportunity.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: GS_OPPORTUNITY_COLLECTION_NAME,
        schema: GsOpportunitySchema,
        collection: GS_OPPORTUNITY_COLLECTION_NAME,
      },
    ]),
  ],
  providers: [GsOpportunityService],
  exports: [GsOpportunityService],
})
export class GsOpportunityModule {}

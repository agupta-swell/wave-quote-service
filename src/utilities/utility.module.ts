import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UtilityController } from './utility.controller';
import {
  GenabilityUsageDataSchema,
  GENABILITY_USAGE_DATA,
  UtilityUsageDetailsSchema,
  UTILITY_USAGE_DETAILS,
} from './utility.schema';
import { UtilityService } from './utility.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: GENABILITY_USAGE_DATA,
        schema: GenabilityUsageDataSchema,
        collection: 'genability_usage_data',
      },
      {
        name: UTILITY_USAGE_DETAILS,
        schema: UtilityUsageDetailsSchema,
        collection: 'utility_usage_details',
      },
    ]),
  ],
  controllers: [UtilityController],
  providers: [UtilityService],
  exports: [UtilityService],
})
export class UtilityModule {}

import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UtilityController } from './utility.controller';
import {
  GenabilityCostDataSchema,
  GenabilityUsageDataSchema,
  GENABILITY_COST_DATA,
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
        collection: 'v2_genability_usage_data',
      },
      {
        name: UTILITY_USAGE_DETAILS,
        schema: UtilityUsageDetailsSchema,
        collection: 'v2_utility_usage_details',
      },
      {
        name: GENABILITY_COST_DATA,
        schema: GenabilityCostDataSchema,
        collection: 'v2_genability_cost_data',
      },
    ]),
  ],
  controllers: [UtilityController],
  providers: [UtilityService],
  exports: [UtilityService],
})
export class UtilityModule {}

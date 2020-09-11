import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UtilityController } from './utility.controller';
import {
  GenabilityTypicalBaseLineSchema,
  GENABILITY_TYPICAL_BASE_LINE,
  UtilityUsageDetailsSchema,
  UTILITY_USAGE_DETAILS,
} from './utility.schema';
import { UtilityService } from './utility.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: GENABILITY_TYPICAL_BASE_LINE,
        schema: GenabilityTypicalBaseLineSchema,
        collection: 'genability_typical_base_line',
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

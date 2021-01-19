import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { UTILITIES, UtilitiesSchema } from './schemas';
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
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
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
      {
        name: UTILITIES,
        schema: UtilitiesSchema,
        collection: 'utilities',
      },
    ]),
  ],
  controllers: [UtilityController],
  providers: [UtilityService],
  exports: [UtilityService],
})
export class UtilityModule {}

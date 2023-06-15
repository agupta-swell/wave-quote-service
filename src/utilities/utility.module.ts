import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { ElectricVehicleModule } from 'src/electric-vehicles/electric-vehicle.module';
import { ExistingSystemModule } from 'src/existing-systems/existing-system.module';
import { ExternalServiceModule } from 'src/external-services/external-service.module';
import { AwsModule } from 'src/shared/aws/aws.module';
import { UsageProfileModule } from 'src/usage-profiles/usage-profile.module';
import { PipeTypicalUsageInterceptor } from './interceptors/pipe-typical-usage.interceptor';
import { UTILITIES, UtilitiesSchema } from './schemas';
import { GenabilityLseDataSchema, GENABILITY_LSE_DATA } from './schemas/genability-lse-caching.schema';
import { GenabilityTariffDataSchema, GENABILITY_TARIFF_DATA } from './schemas/genability-tariff-caching.schema';
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
      {
        name: GENABILITY_LSE_DATA,
        schema: GenabilityLseDataSchema,
        collection: GENABILITY_LSE_DATA,
      },
      {
        name: GENABILITY_TARIFF_DATA,
        schema: GenabilityTariffDataSchema,
        collection: GENABILITY_TARIFF_DATA,
      },
    ]),
    UsageProfileModule,
    ElectricVehicleModule,
    ExternalServiceModule,
    ExistingSystemModule,
    AwsModule,
  ],
  controllers: [UtilityController],
  providers: [UtilityService, PipeTypicalUsageInterceptor],
  exports: [UtilityService],
})
export class UtilityModule {}

import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AwsModule } from 'src/shared/aws/aws.module';
import { ExternalService } from './external-service.service';
import { V2APIMetricsSchema, V2_API_METRICS } from './schemas/v2-api-metrics.schema';
import { GenabilityService } from './sub-services/genability.service';

@Global()
@Module({
  imports: [
    AwsModule,
    MongooseModule.forFeature([
      {
        name: V2_API_METRICS,
        schema: V2APIMetricsSchema,
        collection: 'v2_api_metrics',
      },
    ]),
  ],
  providers: [ExternalService, GenabilityService],
  exports: [ExternalService],
})
export class ExternalServiceModule {}

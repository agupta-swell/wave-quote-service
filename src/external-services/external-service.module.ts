import { Global, Module } from '@nestjs/common';
import { ApiMetricsModule } from 'src/shared/api-metrics/api-metrics.module';
import { AwsModule } from 'src/shared/aws/aws.module';
import { ExternalService } from './external-service.service';
import { GenabilityService } from './sub-services/genability.service';

@Global()
@Module({
  imports: [AwsModule, ApiMetricsModule],
  providers: [ExternalService, GenabilityService],
  exports: [ExternalService],
})
export class ExternalServiceModule {}

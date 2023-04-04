import { Module } from '@nestjs/common';
import { MountTypesModule } from 'src/mount-types-v2/mount-types-v2.module';
import { ApiMetricsModule } from '../api-metrics/api-metrics.module';
import { AwsModule } from '../aws/aws.module';
import { GoogleSunroofGateway } from './google-sunroof.gateway';
import { GoogleSunroofService } from './google-sunroof.service';
import { OnGoogleSunroofGatewayFailInterceptor } from './interceptors/on-google-sunroof-gateway-fail.interceptor';

@Module({
  imports: [AwsModule, MountTypesModule, ApiMetricsModule],
  providers: [GoogleSunroofService, GoogleSunroofGateway, OnGoogleSunroofGatewayFailInterceptor],
  exports: [GoogleSunroofService, OnGoogleSunroofGatewayFailInterceptor],
})
export class GoogleSunroofModule {}

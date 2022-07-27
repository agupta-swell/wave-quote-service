import { Module } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module';
import { GoogleSunroofService } from './google-sunroof.service';
import { GoogleSunroofGateway } from './google-sunroof.gateway';
import { OnGoogleSunroofGatewayFailInterceptor } from './interceptors/on-google-sunroof-gateway-fail.interceptor';

@Module({
  imports: [AwsModule],
  providers: [GoogleSunroofService, GoogleSunroofGateway, OnGoogleSunroofGatewayFailInterceptor],
  exports: [GoogleSunroofService, OnGoogleSunroofGatewayFailInterceptor],
})
export class GoogleSunroofModule {}

import { Module } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module';
import { GoogleSunroofService } from './google-sunroof.service';
import { GoogleSunroofGateway } from './sub-services'

@Module({
  imports: [AwsModule],
  providers: [GoogleSunroofService, GoogleSunroofGateway],
  exports: [GoogleSunroofService],
})
export class GoogleSunroofModule {}

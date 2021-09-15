import { Module } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module';
import { GoogleSunroofService } from './google-sunroof.service';

@Module({
  imports: [AwsModule],
  providers: [GoogleSunroofService],
  exports: [GoogleSunroofService],
})
export class GoogleSunroofModule {}

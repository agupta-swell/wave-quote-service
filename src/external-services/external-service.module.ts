import { Global, Module } from '@nestjs/common';
import { AwsModule } from 'src/shared/aws/aws.module';
import { ExternalService } from './external-service.service';

@Global()
@Module({
  imports: [AwsModule],
  providers: [ExternalService],
  exports: [ExternalService],
})
export class ExternalServiceModule {}

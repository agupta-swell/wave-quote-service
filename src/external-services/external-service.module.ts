import { Global, Module } from '@nestjs/common';
import { AwsModule } from 'src/shared/aws/aws.module';
import { ExternalService } from './external-service.service';
import { DocusignAPIService } from './sub-services/docusign-api.service';

@Global()
@Module({
  imports: [AwsModule],
  providers: [ExternalService, DocusignAPIService],
  exports: [ExternalService, DocusignAPIService],
})
export class ExternalServiceModule {}

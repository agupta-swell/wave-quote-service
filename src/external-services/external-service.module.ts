import { Global, Module } from '@nestjs/common';
import { ExternalService } from './external-service.service';
import { DocusignAPIService } from './sub-services/docusign-api.service';

@Global()
@Module({
  providers: [ExternalService, DocusignAPIService],
  exports: [ExternalService, DocusignAPIService],
})
export class ExternalServiceModule {}

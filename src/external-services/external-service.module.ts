import { Global, Module } from '@nestjs/common';
import { ExternalService } from './external-service.service';

@Global()
@Module({
  providers: [ExternalService],
  exports: [ExternalService],
})
export class ExternalServiceModule {}

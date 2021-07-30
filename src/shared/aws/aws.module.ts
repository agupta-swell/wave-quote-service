import { Module } from '@nestjs/common';
import { S3Service } from './services/s3.service';
import { CredentialService } from './services/credential.service';

@Module({
  providers: [CredentialService, S3Service],
  exports: [CredentialService, S3Service],
})
export class AwsModule {}

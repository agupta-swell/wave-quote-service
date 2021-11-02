import { Module } from '@nestjs/common';
import { S3Service } from './services/s3.service';
import { CredentialService } from './services/credential.service';
import { SecretManagerService } from './services/secret-manager.service';

@Module({
  providers: [CredentialService, S3Service, SecretManagerService],
  exports: [CredentialService, S3Service, SecretManagerService],
})
export class AwsModule {}

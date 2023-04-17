import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { DocusignApiModule } from 'src/shared/docusign/docusign-api.module';
import { AwsModule } from 'src/shared/aws/aws.module';
import { DocusignIntegrationController } from './docusign-integration.controller';
import { DocusignIntegrationService } from './docusign-integration.service';
import { DocusignIntegrationSchema } from './docusign-integration.schema';
import { DOCUSIGN_INTEGRATION_NAME } from './constants';

@Global()
@Module({
  imports: [
    AwsModule,
    DocusignApiModule.forIntegration(),
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: DOCUSIGN_INTEGRATION_NAME,
        schema: DocusignIntegrationSchema,
        collection: DOCUSIGN_INTEGRATION_NAME,
      },
    ]),
  ],
  controllers: [DocusignIntegrationController],
  providers: [DocusignIntegrationService],
  exports: [DocusignIntegrationService],
})
export class DocusignIntegrationModule {}

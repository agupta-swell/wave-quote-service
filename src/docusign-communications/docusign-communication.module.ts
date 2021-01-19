import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigService } from 'src/authentication/jwt-config.service';
import { DocusignCommunicationSchema, DOCUSIGN_COMMUNICATION } from './docusign-communication.schema';
import { DocusignCommunicationService } from './docusign-communication.service';
import { DocusignTemplateService } from './sub-services/docusign-template.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forFeature([
      {
        name: DOCUSIGN_COMMUNICATION,
        schema: DocusignCommunicationSchema,
        collection: 'v2_docusign_communications',
      },
    ]),
  ],
  providers: [DocusignCommunicationService, DocusignTemplateService],
  exports: [DocusignCommunicationService],
})
export class DocusignCommunicationModule {}

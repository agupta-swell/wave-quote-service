import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DOCUSIGN_COMMUNICATION, DocusignCommunicationSchema } from './docusign-communication.schema';
import { DocusignCommunicationService } from './docusign-communication.service';
import { DocusignTemplateService } from './sub-services/docusign-template.service';

@Global()
@Module({
  imports: [
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

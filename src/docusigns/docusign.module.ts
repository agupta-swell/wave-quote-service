import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DOCUSIGN, DocusignSchema } from './docusign.schema';
import { DocusignService } from './docusign.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DOCUSIGN,
        schema: DocusignSchema,
        collection: 'v2_docusign_communications',
      },
    ]),
  ],
  providers: [DocusignService],
  exports: [DocusignService],
})
export class DocusignModule {}

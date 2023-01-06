import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailTemplateSchema, EMAIL_TEMPLATE } from './email-template.schema';
import { EmailTemplateService } from './email-template.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: EMAIL_TEMPLATE,
        schema: EmailTemplateSchema,
        collection: 'email_templates',
      },
    ]),
  ],
  providers: [EmailTemplateService],
  exports: [EmailTemplateService],
})
export class EmailTemplateModule {}

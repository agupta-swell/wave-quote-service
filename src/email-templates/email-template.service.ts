import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';

import { EmailTemplate, EMAIL_TEMPLATE } from './email-template.schema';

@Injectable()
export class EmailTemplateService {
  constructor(@InjectModel(EMAIL_TEMPLATE) private emailTemplateModel: Model<EmailTemplate>) {}

  async getEmailTemplateByEventType(eventType: string): Promise<LeanDocument<EmailTemplate> | null> {
    const res = await this.emailTemplateModel.findOne({ eventType }).lean();
    return res;
  }
}

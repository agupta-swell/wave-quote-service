import { Document, Schema } from 'mongoose';

import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';

export const EMAIL_TEMPLATE = Symbol('EMAIL_TEMPLATE').toString();

export interface EmailTemplate extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
  eventType: string;
  createdBy: string;
  subject: {
    type: string;
    optional: true;
  };
  content: string;
}

export const EmailTemplateSchema = new Schema<EmailTemplate>({
  _id: Schema.Types.Mixed,
  name: {
    type: String,
  },
  createdAt: Date,
  updatedAt: Date,
  eventType: {
    type: String,
    optional: true,
  },
  createdBy: {
    type: String,
  },
  subject: {
    type: String,
    optional: true,
  },
  content: {
    type: String,
  },
});

MongooseNamingStrategy.ExcludeOne(EmailTemplateSchema);

import { Document, Schema } from 'mongoose';
import { TEMPLATE_STATUS } from './constants';

export const DOCUSIGN_TEMPLATE_MASTER = Symbol('DOCUSIGN_TEMPLATE_MASTER').toString();

export interface DocusignTemplateMaster extends Document {
  templateName: string;
  description: string;
  docusignTemplateId: string;
  recipientRoles: string[];
  templateStatus: TEMPLATE_STATUS;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export const DocusignTemplateMasterSchema = new Schema<DocusignTemplateMaster>({
  template_name: String,
  description: String,
  docusign_template_id: String,
  recipient_roles: [String],
  template_status: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

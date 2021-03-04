import { Document, Schema } from 'mongoose';
import { TEMPLATE_STATUS } from './constants';

export const DOCUSIGN_TEMPLATE_MASTER = Symbol('DOCUSIGN_TEMPLATE_MASTER').toString();

export interface DocusignTemplateMaster extends Document {
  template_name: string;
  description: string;
  docusign_template_id: string;
  recipient_roles: string[];
  template_status: TEMPLATE_STATUS;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
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

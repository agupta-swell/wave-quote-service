import { Document, Schema } from 'mongoose';
import { TEMPLATE_STATUS } from './constants';

export const DOCUSIGN_TEMPLATE_MASTER = Symbol('DOCUSIGN_TEMPLATE_MASTER').toString();

export interface IRecipientRoleSchema {
  id: string;
  role_name: string;
  role_description: string;
}

export const RecipientRoleSchema = new Schema<IRecipientRoleSchema>(
  {
    id: String,
    role_name: String,
    role_description: String,
  },
  { _id: false },
);

export interface DocusignTemplateMaster extends Document {
  template_name: string;
  description: string;
  docusign_template_id: string;
  recipient_roles: IRecipientRoleSchema[];
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
  recipient_roles: [RecipientRoleSchema],
  template_status: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

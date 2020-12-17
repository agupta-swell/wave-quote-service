import { Document, Schema } from 'mongoose';
import { TEMPLATE_STATUS } from 'src/docusign-templates-master/constants';
import { DocusignCompositeTemplateMaster, SignerRoleMaster } from 'src/docusign-templates-master/schemas';
import { DocusignCompositeTemplateMasterSchemaWithoutId } from './../docusign-templates-master/schemas/docusign-composite-template-master.schema';
import { SignerRoleMasterSchemaWithoutId } from './../docusign-templates-master/schemas/signer-role-master.schema';
import { CONTRACT_TYPE, PROCESS_STATUS, SIGN_STATUS } from './constants';

export const CONTRACT = Symbol('CONTRACT').toString();

export interface ISignerDetailDataSchema {
  role_id: string;
  role: string;
  first_name: string;
  last_name: string;
  email: string;
  sign_status: SIGN_STATUS;
  sent_on: Date;
  sign_on: Date;
}

const SignerDetailDataSchema = new Schema<ISignerDetailDataSchema>(
  {
    role_id: String,
    role: String,
    first_name: String,
    last_name: String,
    email: String,
    sign_status: String,
    sent_on: Date,
    sign_on: Date,
  },
  { _id: false },
);

export interface ITemplateDetailSchema {
  id: string;
  template_name: string;
  description: string;
  docusign_template_id: string;
  template_status: TEMPLATE_STATUS;
  recipient_roles: SignerRoleMaster[];
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

const TemplateDetailSchema = new Schema<ITemplateDetailSchema>(
  {
    id: String,
    template_name: String,
    description: String,
    docusign_template_id: String,
    template_status: String,
    recipient_roles: [SignerRoleMasterSchemaWithoutId],
    created_by: String,
    created_at: Date,
    updated_by: String,
    updated_at: Date,
  },
  { _id: false },
);

export interface ICompositeTemplateSchema {
  template_details: ITemplateDetailSchema[];
  composite_template_data: DocusignCompositeTemplateMaster;
}

const CompositeTemplateSchema = new Schema<ICompositeTemplateSchema>({
  template_details: [TemplateDetailSchema],
  composite_template_data: DocusignCompositeTemplateMasterSchemaWithoutId,
});

export interface Contract extends Document {
  opportunity_id: string;
  contract_type: CONTRACT_TYPE;
  name: string;
  associated_quote_id: string;
  contract_template_id: string;
  signer_details: ISignerDetailDataSchema[];
  contract_template_detail: ICompositeTemplateSchema;
  contracting_system: string;
  primary_contract_id: string;
  contract_status: PROCESS_STATUS;
  chnage_order_description: string;
  completion_date: string;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const ContractSchema = new Schema<Contract>({
  opportunity_id: String,
  contract_type: String,
  name: String,
  associated_quote_id: String,
  contract_template_id: String,
  signer_details: [SignerDetailDataSchema],
  // FIXME: need to declare later
  contract_template_detail: CompositeTemplateSchema,
  contracting_system: String,
  primary_contract_id: String,
  contract_status: String,
  chnage_order_description: String,
  completion_date: String,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

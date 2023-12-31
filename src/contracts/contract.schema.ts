import { Document, LeanDocument, Schema } from 'mongoose';
import { TEMPLATE_STATUS } from 'src/docusign-templates-master/constants';
import { DocusignCompositeTemplateMaster, SignerRoleMaster } from 'src/docusign-templates-master/schemas';
import {
  DocusignCompositeTemplateMasterSchemaWithoutId,
  SignerRoleMasterSchema,
} from '../docusign-templates-master/schemas';

import { CONTRACT_TYPE, PROCESS_STATUS, SIGN_STATUS, STATUS } from './constants';

export const CONTRACT = Symbol('CONTRACT').toString();

export interface ISignerDetailDataSchema {
  roleId: string;
  role: string;
  fullName: string;
  email: string;
  signStatus: SIGN_STATUS;
  sentOn: Date;
  signedOn: Date;
  phoneNumber: string;
}

export interface IContractMetrics {
  templateId: string;
  templateName: string;
  templateFields: Record<string, string>;
}

const SignerDetailDataSchema = new Schema<Document<any>>(
  {
    role_id: String,
    role: String,
    full_name: String,
    email: String,
    sign_status: String,
    sent_on: Date,
    signed_on: Date,
    phone_number: String,
  },
  { _id: false },
);

const ContractMetricsSchema = new Schema<Document<IContractMetrics>>(
  {
    template_id: String,
    template_name: String,
    template_fields: Object,
  },
  { _id: false },
);

export interface ITemplateDetailSchema {
  id: string;
  templateName: string;
  description: string;
  docusignTemplateId: string;
  templateStatus: TEMPLATE_STATUS;
  recipientRoles: SignerRoleMaster[] | LeanDocument<SignerRoleMaster>[];
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

const TemplateDetailSchema = new Schema<Document<any>>(
  {
    id: String,
    template_name: String,
    description: String,
    docusign_template_id: String,
    template_status: String,
    recipient_roles: [SignerRoleMasterSchema],
    created_by: String,
    created_at: Date,
    updated_by: String,
    updated_at: Date,
  },
  { _id: false },
);

export interface ICompositeTemplateSchema {
  templateDetails: ITemplateDetailSchema[];
  compositeTemplateData: DocusignCompositeTemplateMaster;
}

const CompositeTemplateSchema = new Schema<Document<ICompositeTemplateSchema>>(
  {
    template_details: [TemplateDetailSchema],
    composite_template_data: DocusignCompositeTemplateMasterSchemaWithoutId,
  },
  { _id: false },
);

export interface Contract extends Document {
  gsOpportunityId: string;
  opportunityId: string;
  contractType: CONTRACT_TYPE;
  name: string;
  associatedQuoteId: string;
  contractTemplateId: string;
  signerDetails: ISignerDetailDataSchema[];
  contractTemplateDetail: ICompositeTemplateSchema;
  contractingSystem: string;
  primaryContractId: string;
  status: STATUS;
  contractStatus: PROCESS_STATUS;
  changeOrderDescription: string;
  contractingSystemReferenceId: string;
  createdBy: string;
  systemDesignId: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  projectCompletionDate: Date;
  utilityProgramId: string;
  contractMetrics?: IContractMetrics[];
}

export const ContractSchema = new Schema<Contract>({
  gs_opportunity_id: String,
  opportunity_id: String,
  contract_type: String,
  name: String,
  associated_quote_id: String,
  contract_template_id: String,
  signer_details: [SignerDetailDataSchema],
  contract_template_detail: CompositeTemplateSchema,
  contracting_system: String,
  primary_contract_id: String,
  contract_status: String,
  status: String,
  change_order_description: String,
  project_completion_date: Date,
  contracting_system_reference_id: String,
  system_design_id: String,
  utility_program_id: String,
  contract_metrics: { type: [ContractMetricsSchema], optional: true },

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

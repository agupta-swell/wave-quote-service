import { Document, Schema } from 'mongoose';
import { SYSTEM_TYPE } from '../constants';

export const DOCUSIGN_COMPOSITE_TEMPLATE_MASTER = Symbol('DOCUSIGN_COMPOSITE_TEMPLATE_MASTER').toString();

export interface DocusignCompositeTemplateMaster extends Document {
  name: string;
  description: string;
  docusignTemplateIds: string[];
  isApplicableForChangeOrders: boolean;
  applicableFundingSources: string[];
  applicableUtilityPrograms: string[];
  applicableUtilities: string[];
  applicableStates: string[];
  applicableSystemTypes: SYSTEM_TYPE[];
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export const DocusignCompositeTemplateMasterSchemaWithoutId = new Schema<DocusignCompositeTemplateMaster>(
  {
    name: String,
    description: String,
    docusign_template_ids: [String],
    is_applicable_for_change_orders: Boolean,
    applicable_funding_sources: [String],
    applicable_utility_programs: [String],
    applicable_utilities: [String],
    applicable_states: [String],
    applicable_system_types: [String],
    created_at: { type: Date, default: Date.now },
    created_by: String,
    updated_at: { type: Date, default: Date.now },
    updated_by: String,
  },
  { _id: false },
);

export const DocusignCompositeTemplateMasterSchema = new Schema<DocusignCompositeTemplateMaster>({
  name: String,
  description: String,
  docusign_template_ids: [String],
  is_applicable_for_change_orders: Boolean,
  applicable_funding_sources: [String],
  applicable_utility_programs: [String],
  applicable_utilities: [String],
  applicable_states: [String],
  applicable_system_types: [String],
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

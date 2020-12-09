import { Document, Schema } from 'mongoose';
import { SYSTEM_TYPE } from '../constants';

export const DOCUSIGN_COMPOSITE_TEMPLATE_MASTER = Symbol('DOCUSIGN_COMPOSITE_TEMPLATE_MASTER').toString();

export interface DocusignCompositeTemplateMaster extends Document {
  name: string;
  description: string;
  docusign_template_ids: string[];
  is_applicable_for_change_orders: boolean;
  applicable_funding_sources: string[];
  applicable_utility_programs: string[];
  applicable_utilities: string[];
  applicable_states: string[];
  applicable_system_types: SYSTEM_TYPE[];
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

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

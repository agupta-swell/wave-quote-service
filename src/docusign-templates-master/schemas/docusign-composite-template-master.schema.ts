import { Document, Schema } from 'mongoose';
import { CONTRACT_TYPE } from 'src/contracts/constants';
import { SYSTEM_TYPE } from '../constants';

export const DOCUSIGN_COMPOSITE_TEMPLATE_MASTER = Symbol('DOCUSIGN_COMPOSITE_TEMPLATE_MASTER').toString();

export interface DocusignCompositeTemplateMaster extends Document {
  name: string;
  description: string;
  docusignTemplateIds: string[];
  type: CONTRACT_TYPE;
  applicableRebatePrograms: (string | null)[];
  applicableFundingSources: string[];
  applicableUtilityPrograms: (string | null)[];
  applicableFinanciers: string[];
  applicableFinancialProductTypes: string[];
  applicableUtilities: string[];
  applicableStates: string[];
  applicableSystemTypes: SYSTEM_TYPE[];
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  filenameForDownloads?: string;
  beginPageNumberingTemplateId: string;
}

export const DocusignCompositeTemplateMasterSchemaWithoutId = new Schema<DocusignCompositeTemplateMaster>(
  {
    name: String,
    description: String,
    docusign_template_ids: [String],
    type: String,
    applicable_rebate_programs: [String],
    applicable_funding_sources: [String],
    applicable_utility_programs: [String],
    applicable_financiers: [String],
    applicable_financial_product_types: [String],
    applicable_utilities: [String],
    applicable_states: [String],
    applicable_system_types: [String],
    begin_page_numbering_template_id: String,
    created_at: { type: Date, default: Date.now },
    created_by: String,
    updated_at: { type: Date, default: Date.now },
    updated_by: String,
    filename_for_downloads: {
      type: String,
      required: false,
    },
  },
  { _id: false },
);

export const DocusignCompositeTemplateMasterSchema = new Schema<DocusignCompositeTemplateMaster>({
  name: String,
  description: String,
  docusign_template_ids: [String],
  type: String,
  filename_for_downloads: String,
  applicable_rebate_programs: [String],
  applicable_funding_sources: [String],
  applicable_financiers: [String],
  applicable_financial_product_types: [String],
  applicable_utility_programs: [String],
  applicable_utilities: [String],
  applicable_states: [String],
  applicable_system_types: [String],
  begin_page_numbering_template_id: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

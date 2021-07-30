import { Document, Schema } from 'mongoose';

export const PROPOSAL_SECTION_MASTER = Symbol('PROPOSAL_SECTION_MASTER').toString();

export interface ProposalSectionMaster extends Document {
  name: string;
  applicableFinancialProducts: string[];
  applicableProducts: string[];
  componentName: string;
}

export const ProposalSectionMasterSchema = new Schema<ProposalSectionMaster>({
  name: String,
  applicable_financial_products: [String],
  applicable_products: [String],
  component_name: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

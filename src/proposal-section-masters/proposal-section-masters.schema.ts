import { Document, Schema } from 'mongoose';

export const PROPOSAL_SECTION_MASTER = Symbol('PROPOSAL_SECTION_MASTER').toString();

export interface ProposalSectionMaster extends Document {
  proposal_section_name: string;
  applicable_financial_products: string[];
  applicable_products: string[];
  component_name: string;
}

export const ProposalSectionMasterSchema = new Schema<ProposalSectionMaster>({
  proposal_section_name: String,
  applicable_financial_products: [String],
  applicable_products: [String],
  component_name: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

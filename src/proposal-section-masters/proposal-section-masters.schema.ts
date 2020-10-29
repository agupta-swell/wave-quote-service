import { Document, Schema } from 'mongoose';

export const PROPOSAL_SECTION_MASTER = Symbol('PROPOSAL_SECTION_MASTER').toString();

export interface ProposalSectionMaster extends Document {
  proposal_section_name: string;
  applicable_financial_product: string;
  applicable_product: string;
  component_name: string;
}

export const ProposalSectionMasterSchema = new Schema<ProposalSectionMaster>({
  proposal_section_name: String,
  applicable_financial_product: [String],
  applicable_product: [String],
  component_name: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

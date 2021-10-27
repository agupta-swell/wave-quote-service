import { Document, Schema } from 'mongoose';

export const PROPOSAL_SECTIONS_MASTER_COLL = 'v2_proposal_sections_master';

export interface IProposalSectionMaster {
  name: string;
  applicableFundingSources: string[];
  applicableQuoteTypes: string[];
  componentName: string;
  createdAt: Date;
  createdBy: String;
  updatedAt: Date;
  updatedBy: String;
}
export interface ProposalSectionMaster extends Document, IProposalSectionMaster {}

export const ProposalSectionMasterSchema = new Schema<ProposalSectionMaster>({
  name: String,
  applicable_funding_sources: [String],
  applicable_quote_types: [String],
  component_name: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

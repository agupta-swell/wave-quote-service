import { Document, Schema } from 'mongoose';
import { PRIMARY_QUOTE_TYPE } from 'src/quotes/constants';

export const PROPOSAL_SECTIONS_MASTER_COLL = 'v2_proposal_sections_master';

export interface IProposalSectionMaster {
  name: string;
  applicableFundingSources: string[];
  applicableQuoteTypes: PRIMARY_QUOTE_TYPE[];
  componentName: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
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

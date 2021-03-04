import { Document, Schema } from 'mongoose';

export const PROPOSAL_ANALYTIC = Symbol('PROPOSAL_ANALYTIC').toString();
export interface ProposalAnalytic extends Document {
  proposal_id: string;
  view_by: string;
  views: Date[];
  downloads: Date[];
}

export const ProposalAnalyticSchema = new Schema<ProposalAnalytic>({
  proposal_id: String,
  view_by: String,
  views: [Date],
  downloads: [Date],
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

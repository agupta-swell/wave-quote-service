import { Document, Schema } from 'mongoose';

export const PROPOSAL_ANALYTIC = Symbol('PROPOSAL_ANALYTIC').toString();

export interface ITracking {
  by: string;
  at: Date;
}
export interface ProposalAnalytic extends Document {
  proposalId: string;
  viewBy: string;
  sends: ITracking[];
  views: ITracking[];
  downloads: ITracking[];
}

const trackingSchema = new Schema(
  {
    by: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

export const ProposalAnalyticSchema = new Schema<ProposalAnalytic>(
  {
    proposal_id: String,
    view_by: String,
    sends: { type: [trackingSchema], default: [] },
    views: { type: [trackingSchema], default: [] },
    downloads: { type: [trackingSchema], default: [] },
    created_by: String,
    updated_by: String,
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

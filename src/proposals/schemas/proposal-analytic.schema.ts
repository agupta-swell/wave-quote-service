import { Document, Schema } from 'mongoose';

export const PROPOSAL_ANALYTIC = Symbol('PROPOSAL_ANALYTIC').toString();

export enum TRACKING_TYPE {
  SENT = 'Sent',
  VIEWED = 'Viewed',
  DOWNLOADED = 'Downloaded',
}

export interface ITracking {
  by: string;
  at: Date;
  type: TRACKING_TYPE;
}

const TrackingSchema = new Schema(
  {
    by: String,
    at: { type: Date, default: Date.now },
    type: String,
  },
  { _id: false },
);

export interface ProposalAnalytic extends Document {
  proposalId: string;
  viewBy: string;
  tracking: ITracking[];
}

export const ProposalAnalyticSchema = new Schema<ProposalAnalytic>(
  {
    proposal_id: String,
    view_by: String,
    tracking: { type: [TrackingSchema], default: [] },
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

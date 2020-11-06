import { Schema, Document } from 'mongoose';

export const PROPOSAL_ANALYTIC = Symbol('PROPOSAL_ANALYTIC').toString();

export interface IStatisticSchema {
  on: Date;
  view_counter: number;
}

const StatisticSchema = new Schema<IStatisticSchema>(
  {
    on: Date,
    view_counter: Number,
  },
  { _id: false },
);

export interface IDataSchema {
  view_type: string;
  statistics: IStatisticSchema[];
}

const DataSchema = new Schema<IDataSchema>(
  {
    view_type: String,
    statistics: [StatisticSchema],
  },
  { _id: false },
);

export interface ProposalAnalytic extends Document {
  proposal_id: string;
  view_by: string;
  data: IDataSchema[];
}

export const ProposalAnalyticSchema = new Schema<ProposalAnalytic>({
  proposal_id: String,
  view_by: String,
  data: [DataSchema],
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

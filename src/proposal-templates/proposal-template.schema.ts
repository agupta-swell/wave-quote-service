import { Document, Schema } from 'mongoose';

export const PROPOSAL_TEMPLATE = Symbol('PROPOSAL_TEMPLATE').toString();

export interface ISectionSchema {
  id: string;
  name: string;
  component_name: string;
}

const SectionSchema = new Schema<ISectionSchema>(
  {
    id: String,
    name: String,
    component_name: String,
  },
  { _id: false },
);

export interface ProposalTemplate extends Document {
  name: string;
  sections: ISectionSchema[];
}

export const ProposalTemplateSchema = new Schema<ProposalTemplate>({
  name: String,
  sections: [SectionSchema],
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

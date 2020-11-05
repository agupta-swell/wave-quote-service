import { SystemDesign } from './../system-designs/system-design.schema';
import { IDetailedQuoteSchema } from './../quotes/quote.schema';
import { Document, Schema } from 'mongoose';

export const PROPOSAL = Symbol('PROPOSAL').toString();

export interface IProposalSchema {
  isSelected: boolean;
  quoteData: IDetailedQuoteSchema;
  systemDesignData: SystemDesign;
}

const SectionSchema = new Schema<IProposalSchema>(
  {
    // id: String,
    // name: String,
    // component_name: String,
  },
  { _id: false },
);

export interface Proposal extends Document {
  opportunity_id: string;
  system_design_id: string;
  quote_id: number;
  proposal: IProposalSchema;
  valid_till: Date;
}

export const ProposalSchema = new Schema<Proposal>({
  name: String,
  sections: [SectionSchema],
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

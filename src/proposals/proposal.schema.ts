import { SystemDesign, SystemDesignSchema } from './../system-designs/system-design.schema';
import { DetailedQuoteSchema, IDetailedQuoteSchema } from './../quotes/quote.schema';
import { Document, Schema } from 'mongoose';

export const PROPOSAL = Symbol('PROPOSAL').toString();

export interface IRecipientSchema {
  email: string;
  name: string;
}

const RecipientSchema = new Schema<IRecipientSchema>({
  email: String,
  name: String,
});

export interface IProposalSchema {
  is_selected: boolean;
  quote_data: IDetailedQuoteSchema;
  system_design_data: SystemDesign;
  proposal_name: string;
  proposal_creation_date: Date;
  proposal_sent_date: Date;
  recipients: IRecipientSchema[];
  proposal_validity_period: number;
  template_id: number;
  status: string;
  pdf_file_url: string;
}

const SectionSchema = new Schema<IProposalSchema>(
  {
    is_selected: Boolean,
    quote_data: DetailedQuoteSchema,
    system_design_data: SystemDesignSchema,
    proposal_name: String,
    proposal_creation_date: Date,
    proposal_sent_date: Date,
    recipients: [RecipientSchema],
    proposal_validity_period: Number,
    template_id: Number,
    status: String,
    pdf_file_url: String,
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

import { Document, Schema } from 'mongoose';
import { DetailedQuoteSchema, IDetailedQuoteSchema } from '../quotes/quote.schema';
import { SystemDesign, SystemDesignSchema } from '../system-designs/system-design.schema';
import { PROPOSAL_STATUS } from './constants';

export const PROPOSAL = Symbol('PROPOSAL').toString();

export interface IRecipientSchema {
  email: string;
  name: string;
}

const RecipientSchema = new Schema<Document<IRecipientSchema>>(
  {
    email: String,
    name: String,
  },
  { _id: false },
);

export interface IDetailedProposalSchema {
  is_selected: boolean;
  quote_data: IDetailedQuoteSchema;
  system_design_data: SystemDesign;
  proposal_name: string;
  proposal_creation_date: Date;
  proposal_sent_date: Date;
  recipients: IRecipientSchema[];
  proposal_validity_period: number;
  template_id: string;
  status: PROPOSAL_STATUS;
  pdf_file_url: string;
  html_file_url: string;
}

const DetailedProposalSchema = new Schema<Document<IDetailedProposalSchema>>(
  {
    is_selected: Boolean,
    quote_data: DetailedQuoteSchema,
    system_design_data: SystemDesignSchema,
    proposal_name: String,
    proposal_creation_date: Date,
    proposal_sent_date: Date,
    recipients: [RecipientSchema],
    proposal_validity_period: Number,
    template_id: String,
    status: String,
    pdf_file_url: String,
    html_file_url: String,
  },
  { _id: false },
);

export interface Proposal extends Document {
  opportunity_id: string;
  system_design_id: string;
  quote_id: string;
  detailed_proposal: IDetailedProposalSchema;
  valid_till: Date;
}

export const ProposalSchema = new Schema<Proposal>({
  name: String,
  opportunity_id: String,
  system_design_id: String,
  quote_id: String,
  detailed_proposal: DetailedProposalSchema,
  valid_till: Date,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

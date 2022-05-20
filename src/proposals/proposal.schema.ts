import { Document, Schema } from 'mongoose';
import { IProposalTemplate, ProposalTemplateSchema } from 'src/proposal-templates/proposal-template.schema';
import { DetailedQuoteSchema, IDetailedQuoteSchema } from '../quotes/quote.schema';
import { SystemDesign, SystemDesignSchema } from '../system-designs/system-design.schema';
import { PROPOSAL_STATUS } from './constants';

export const PROPOSAL = Symbol('PROPOSAL').toString();

export interface IRecipientSchema {
  email?: string;
  firstName?: string;
  lastName?: string;
}

const RecipientSchema = new Schema<Document<IRecipientSchema>>(
  {
    email: {
      type: String,
      unique: true,
    },
    first_name: String,
    last_name: String,
  },
  { _id: false },
);

export interface ISampleContractUrl {
  sampleContractUrl: string;
  compositeTemplateId: string;
}

const SampleContractUrlSchema = new Schema<Document<ISampleContractUrl>>(
  {
    sample_contract_url: String,
    composite_template_id: String,
  },
  { _id: false },
);

export interface IDetailedProposalSchema {
  isSelected: boolean;
  quoteData: IDetailedQuoteSchema;
  systemDesignData: SystemDesign;
  proposalName: string;
  proposalCreationDate: Date;
  proposalSentDate: Date;
  recipients: IRecipientSchema[];
  proposalValidityPeriod: number;
  templateId: string;
  status: PROPOSAL_STATUS;
  pdfFileUrl: string;
  htmlFileUrl: string;
  envelopeId?: string;
  sampleContractUrl?: ISampleContractUrl[];
  proposalTemplateSnapshot: IProposalTemplate;
}

const ProposalTemplateSnapshot = new Schema(ProposalTemplateSchema.obj, { _id: false });

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
    envelope_id: String,
    sample_contract_url: [SampleContractUrlSchema],
    proposal_template_snapshot: ProposalTemplateSnapshot,
  },
  { _id: false },
);

export interface Proposal extends Document {
  opportunityId: string;
  systemDesignId: string;
  quoteId: string;
  detailedProposal: IDetailedProposalSchema;
  validTill: Date;
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

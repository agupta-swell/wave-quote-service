import { Document, Schema } from 'mongoose';

export const PROPOSAL_TEMPLATE = Symbol('PROPOSAL_TEMPLATE').toString();

export interface ISectionSchema {
  id: string;
  name: string;
  component_name: string;
}

const SectionSchema = new Schema<Document<ISectionSchema>>(
  {
    id: String,
    name: String,
    component_name: String,
  },
  { _id: false },
);

export interface IProposalSectionMaster {
  applicable_financial_product: string;
  applicable_products: string[];
}

const ProposalSectionMaster = new Schema<Document<IProposalSectionMaster>>({
  applicable_financial_product: String,
  applicable_products: [String],
});

export interface ProposalTemplate extends Document {
  name: string;
  sections: ISectionSchema[];
  proposal_section_master: IProposalSectionMaster;
}

export const ProposalTemplateSchema = new Schema<ProposalTemplate>({
  name: String,
  sections: [SectionSchema],
  proposal_section_master: ProposalSectionMaster,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

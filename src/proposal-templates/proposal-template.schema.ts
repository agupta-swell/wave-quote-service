import { Document, Schema } from 'mongoose';

export const PROPOSAL_TEMPLATE = Symbol('PROPOSAL_TEMPLATE').toString();

export enum EApplicableProducts {
  PV = 'pv',
  STORAGE = 'storage',
  PV_AND_STORAGE = 'pv-storage',
}

export interface ISectionSchema {
  id: string;
  name: string;
  componentName: string;
}

const SectionSchema = new Schema<Document<ISectionSchema>>(
  {
    id: String,
    name: String,
    component_name: String,
  },
  { _id: false },
);

SectionSchema.virtual('_id').set(function (value) {
  this.id = value;
});

export interface IProposalSectionMaster {
  applicableFinancialProduct: string[];
  applicableProducts: string[];
}

const ProposalSectionMaster = new Schema<Document<IProposalSectionMaster>>({
  applicable_financial_product: [String],
  applicable_products: [String],
});

export interface ProposalTemplate extends Document {
  name: string;
  sections: ISectionSchema[];
  proposalSectionMaster: IProposalSectionMaster;
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

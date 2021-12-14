import { Document, Schema } from 'mongoose';
import {
  IProposalSectionMaster,
  ProposalSectionMaster,
  ProposalSectionMasterSchema,
} from 'src/proposal-section-masters/proposal-section-master.schema';

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

const ProposalSectionMasterSnapshotSchema = new Schema(
  {
    applicable_funding_sources: [String],
    applicable_quote_types: [String],
  },
  { _id: false },
);

export interface IProposalTemplate {
  name: string;
  description: string;
  sections: ISectionSchema[];
  proposalSectionMaster: IProposalSectionMaster;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

export interface ProposalTemplate extends IProposalTemplate, Document {}

export const ProposalTemplateSchema = new Schema<ProposalTemplate>({
  name: String,
  sections: [SectionSchema],
  description: String,
  proposal_section_master: ProposalSectionMasterSnapshotSchema,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

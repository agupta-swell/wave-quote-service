import { Document, ObjectId } from 'mongoose';

export interface IInstalledProduct {
  opportunityId: string;
  projectId: string;
  gsOpportunityId: string;
  productId: string;
  arrayIndex: number;
  quantity: number;
  partNumber: string;
  serialNumber: string;
  notes: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export type IInstalledProductDocument = IInstalledProduct & Document<ObjectId>;

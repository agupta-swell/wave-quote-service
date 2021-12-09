import { Document } from 'mongoose';

export interface ITaxCreditConfig {
  name: string;
  percentage: number;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export type ITaxCreditConfigDocument = Document & ITaxCreditConfig;

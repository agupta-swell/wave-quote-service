import { Document } from 'mongoose';
import { ITaxCreditConfig } from '.';

export interface ITaxCreditConfigSnapshot {
  name: string;
  percentage: number;
  value: number;
  taxCreditConfigDataId: string;
  taxCreditConfigDataSnapshot: ITaxCreditConfig;
  taxCreditConfigDataSnapshotDate: Date;
}

export type ITaxCreditConfigSnapshotDocument = Document & ITaxCreditConfigSnapshot;

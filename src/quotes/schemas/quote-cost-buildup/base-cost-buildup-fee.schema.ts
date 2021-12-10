import { Document, Schema } from 'mongoose';
import { IBaseCostBuildupFee } from 'src/quotes/interfaces';

export const BaseCostBuildupFeeSchema = new Schema<Document & IBaseCostBuildupFee>(
  {
    unit_percentage: Number,
    total: Number,
  },
  { _id: false },
);

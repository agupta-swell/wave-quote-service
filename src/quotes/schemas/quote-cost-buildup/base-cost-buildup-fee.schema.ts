import { Document, Schema } from 'mongoose';
import { IBaseCostBuildupFee } from 'src/quotes/interfaces';
import { cogsImpactSchemaDefination } from './cogs-impact.schema';
import { marginImpactSchemaDefination } from './margin-impact.schema';

export const BaseCostBuildupFeeSchema = new Schema<Document & IBaseCostBuildupFee>(
  {
    unit_percentage: Number,
    total: Number,
    ...cogsImpactSchemaDefination,
    ...marginImpactSchemaDefination,
  },
  { _id: false },
);

import { Document, Schema } from 'mongoose';
import { ICashDiscount } from 'src/quotes/interfaces/quote-cost-buildup/ICostBuildupFee';
import { marginImpactSchemaDefination } from './margin-impact.schema';
import { cogsImpactSchemaDefination } from './cogs-impact.schema';

export const CashDiscountSchema = new Schema<Document & ICashDiscount>(
  {
    name: String,
    unit_percentage: Number,
    total: Number,
    ...cogsImpactSchemaDefination,
    ...marginImpactSchemaDefination,
  },
  { _id: false },
);

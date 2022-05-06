import { Document, Schema } from 'mongoose';
import { ICashDiscount } from 'src/quotes/interfaces/quote-cost-buildup/ICostBuildupFee';
import { marginImpactSchemaDefinition } from './margin-impact.schema';
import { cogsImpactSchemaDefinition } from './cogs-impact.schema';

export const CashDiscountSchema = new Schema<Document & ICashDiscount>(
  {
    name: String,
    unit_percentage: Number,
    total: Number,
    ...cogsImpactSchemaDefinition,
    ...marginImpactSchemaDefinition,
  },
  { _id: false },
);

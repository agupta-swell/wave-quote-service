import { Document, Schema } from 'mongoose';
import { ICashDiscount } from 'src/quotes/interfaces/quote-cost-buildup/ICostBuildupFee';

export const CashDiscountSchema = new Schema<Document & ICashDiscount>(
  {
    name: String,
    unit_percentage: Number,
    total: Number,
  },
  { _id: false },
);

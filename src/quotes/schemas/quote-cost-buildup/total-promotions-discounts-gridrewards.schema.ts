import { Schema, Document } from 'mongoose';
import { ITotalPromotionsDiscountsAndSwellGridrewards } from 'src/quotes/interfaces/quote-cost-buildup/ITotalPromotionsDiscountsGridrewards';

export const totalPromotionsDiscountsAndSwellGridrewardsSchema = new Schema<
  Document & ITotalPromotionsDiscountsAndSwellGridrewards
>(
  {
    cogs_amount: Number,
    margin_amount: Number,
    total: Number,
  },
  {
    _id: false,
  },
);

import { Schema, Document } from 'mongoose';
import { ITotalPromotionsDiscountsAndSwellGridrewards } from 'src/quotes/interfaces/quote-cost-buildup/ITotalPromotionsDiscountsGridrewards';

export const totalPromotionsDiscountsAndSwellGridrewardsSchema = new Schema<
  Document & ITotalPromotionsDiscountsAndSwellGridrewards
>({
  total: Number,
});

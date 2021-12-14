import { Document, Schema } from 'mongoose';
import { IProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards } from 'src/quotes/interfaces';

export const ProjectSubtotalWithDiscountsPromotionsAndSwellGridrewardsSchema = new Schema<
  Document & IProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards
>(
  {
    cost: Number,
    margin_percentage: Number,
    net_margin: Number,
    net_cost: Number,
  },
  {
    _id: false,
  },
);

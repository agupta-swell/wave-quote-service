import { Document, Schema } from 'mongoose';
import { IBaseQuoteMarginData } from 'src/quotes/interfaces';

export const BaseQuoteMarginDataSchema = new Schema<
  Document & IBaseQuoteMarginData
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

import { Schema, Document } from 'mongoose';
import { ISalesTaxData } from 'src/quotes/interfaces/quote-cost-buildup/ISalesTaxData';

export const SalesTaxDataSchema = new Schema<Document & ISalesTaxData>(
  {
    tax_rate: Number,
    tax_amount: Number,
  },
  {
    _id: false,
  },
);

import { Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';
import { IDiscountDocument } from './interfaces';

export const DiscountSchema = new Schema<IDiscountDocument>({
  _id: {
    type: Schema.Types.Mixed,
    alias: 'id',
  },
  amount: Number,
  endDate: {
    type: Date,
    alias: 'end_date',
  },
  name: String,
  startDate: {
    type: Date,
    alias: 'start_date',
  },
  type: String,
  cogsAllocation: {
    type: Number,
    alias: 'cogs_allocation',
  },
  marginAllocation: {
    type: Number,
    alias: 'margin_allocation',
  },
  cogsAmount: {
    type: Number,
    alias: 'cogs_amount',
  },
  marginAmount: {
    type: Number,
    alias: 'margin_amount',
  },
});

MongooseNamingStrategy.ExcludeOne(DiscountSchema);

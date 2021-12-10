import { Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'mongoose-schema-mapper';
import { IPromotionDocument } from './interfaces';

export const PromotionSchema = new Schema<IPromotionDocument>({
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
});

MongooseNamingStrategy.ExcludeOne(PromotionSchema);

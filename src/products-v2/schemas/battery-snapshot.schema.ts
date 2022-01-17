import { Schema } from 'mongoose';
import { BaseSnapshotProductSchemaObject } from './base-snapshot.schema';
import { BatteryRatingSchema } from './rating.schema';

export const BatterySnapshotSchema = new Schema(
  {
    ...BaseSnapshotProductSchemaObject,
    battery_type: String,
    minimum_reserve_percentage: Number,
    round_trip_efficiency: Number,
    manufacturer_id: Schema.Types.ObjectId,
    ratings: BatteryRatingSchema,
    product_image: String,
    product_data_sheet: String,
  },
  { _id: false },
);

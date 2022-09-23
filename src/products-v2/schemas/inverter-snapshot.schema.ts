import { Schema } from 'mongoose';
import { BaseSnapshotProductSchemaObject } from './base-snapshot.schema';
import { WattRatingSchema } from './rating.schema';

export const InverterSnapshotSchema = new Schema(
  {
    ...BaseSnapshotProductSchemaObject,
    inverter_type: String,
    manufacturer_id: Schema.Types.ObjectId,
    ratings: WattRatingSchema,
    inverter_efficiency: Number,
  },
  { _id: false },
);

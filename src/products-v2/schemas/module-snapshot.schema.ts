import { Schema } from 'mongoose';
import { BaseSnapshotProductSchemaObject } from './base-snapshot.schema';
import { DimensionSchema } from './dimension.schema';
import { WattRatingSchema } from './rating.schema';

export const ModuleSnapshotSchema = new Schema(
  {
    ...BaseSnapshotProductSchemaObject,
    dimensions: DimensionSchema,
    manufacturer_id: Schema.Types.ObjectId,
    ratings: WattRatingSchema,
    first_year_degradation: Number,
  },
  { _id: false },
);

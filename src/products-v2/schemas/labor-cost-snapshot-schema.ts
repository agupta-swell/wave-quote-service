import { Schema } from 'mongoose';
import { BaseSnapshotProductSchemaObject } from './base-snapshot.schema';

export const LaborCostSnapshotSchema = new Schema(
  {
    ...BaseSnapshotProductSchemaObject,
    pricing_unit: String,
    insertion_rule: String,
  },
  {
    _id: false,
  },
);

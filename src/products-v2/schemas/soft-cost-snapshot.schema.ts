import { Schema } from 'mongoose';
import { BaseSnapshotProductSchemaObject } from './base-snapshot.schema';

export const SoftCostSnapshotSchema = new Schema(
  {
    ...BaseSnapshotProductSchemaObject,
    description: String,
    insertion_rule: String,
  },
  {
    _id: false,
  },
);

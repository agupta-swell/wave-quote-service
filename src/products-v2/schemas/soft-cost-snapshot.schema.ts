import { Schema } from 'mongoose';
import { BaseSnapshotProductSchemaObject } from './base-snapshot.schema';

export const SoftCostSnapshotSchema = new Schema(
  {
    ...BaseSnapshotProductSchemaObject,
    description: String,
  },
  {
    _id: false,
  },
);

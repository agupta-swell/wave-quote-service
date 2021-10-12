import { Schema } from 'mongoose';
import { BaseSnapshotProductSchemaObject } from './base-snapshot.schema';

export const AdderSnapshotSchema = new Schema(
  {
    ...BaseSnapshotProductSchemaObject,
    pricing_unit: String,
  },
  {
    _id: false,
  },
);

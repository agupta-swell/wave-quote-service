import { Schema } from 'mongoose';
import { BaseSnapshotProductSchemaObject } from './base-snapshot.schema';

export const BalanceOfSystemSnapshotSchema = new Schema(
  {
    ...BaseSnapshotProductSchemaObject,
    insertion_rule: String,
    pricing_unit: String,
  },
  { _id: false },
);

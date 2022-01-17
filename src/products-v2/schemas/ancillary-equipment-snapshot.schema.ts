import { Schema } from 'mongoose';
import { BaseSnapshotProductSchemaObject } from './base-snapshot.schema';

export const AncillaryEquipmentSnapshotSchema = new Schema(
  {
    ...BaseSnapshotProductSchemaObject,
    insertion_rule: String,
    manufacturer_id: Schema.Types.ObjectId,
  },
  { _id: false },
);

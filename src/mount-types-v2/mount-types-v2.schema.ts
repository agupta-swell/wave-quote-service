import { Document, Schema } from 'mongoose';

export const MOUNT_TYPE = Symbol('MOUNT_TYPE').toString();

export interface MountTypesDocument extends Document {
  name: string;
  deratePercentage: number;
}

export const MountTypesSchema = new Schema<MountTypesDocument>({
  name: String,
  derate_percentage: Number,
});

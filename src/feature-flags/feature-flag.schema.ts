import { Document, Schema } from 'mongoose';

export const FEATURE_FLAG = Symbol('FEATURE_FLAG').toString();

export interface IFeatureFlagDocument extends Document {
  name: string;
  value: string;
  description: string;
  isEnabled: boolean;
}

export const FeatureFlagSchema = new Schema<IFeatureFlagDocument>({
  name: String,
  value: String,
  description: String,
  isEnabled: Boolean,
});

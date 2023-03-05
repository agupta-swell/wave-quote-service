import { Document, Schema } from 'mongoose';

export const V2_API_METRICS = Symbol('V2_API_METRICS').toString();

export enum EVendor {
  GENABILITY = 'GENABILITY',
  PVWATTS = 'PVWATTS',
}

export enum EHttpMethod {
  GET = 'GET',
  POST = 'POST',
}

export interface IV2APIMetrics extends Document {
  vendor: EVendor;
  method: EHttpMethod;
  route: string;
  month: string;
  count: number;
}

export const V2APIMetricsSchema = new Schema<IV2APIMetrics>({
  vendor: { type: String, enum: EVendor },
  method: { type: String, enum: EHttpMethod },
  route: String,
  month: String,
  count: { type: Number, default: 0 },
});

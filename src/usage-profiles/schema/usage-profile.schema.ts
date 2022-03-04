import { Schema } from 'mongoose';

const SeasonSchema = new Schema({
  applicable_months: [Number],
  hourly_allocation: [Number],
});

export const UsageProfileSchema = new Schema({
  name: String,
  description: String,
  seasons: [SeasonSchema],
  created_at: Date,
  updated_at: Date,
  created_by: String,
  updated_by: String,
});

export const UsageProfileSnapshotSchema = new Schema(
  {
    usage_profile_id: String,
    usage_profile_snapshot_date: Date,
    usage_profile_snapshot: new Schema(
      {
        ...UsageProfileSchema.obj,
      },
      { _id: false },
    ),
  },
  {
    _id: false,
  },
);

import { Schema } from 'mongoose';

export const RatingSchema = new Schema(
  {
    kilowatts: Number,
    kilowatt_hours: Number,
    watts: Number,
  },
  { _id: false },
);

export const WattRatingSchema = new Schema(
  {
    watts: Number,
    wattsPtc: Number,
  },
  { _id: false },
);

export const BatteryRatingSchema = new Schema(
  {
    kilowatts: Number,
    kilowatt_hours: Number,
  },
  { _id: false },
);

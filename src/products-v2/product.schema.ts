import { Schema, Types } from 'mongoose';
import { IUnknownProduct } from './interfaces';

const DimensionSchema = new Schema(
  {
    length: Number,
    width: Number,
  },
  { _id: false },
);

const RatingSchema = new Schema({
  kilowatts: Number,
  kilowatt_hours: Number,
  watts: Number,
});

export const ProductSchema = new Schema<IUnknownProduct>({
  name: String,
  type: String,
  part_numbers: [String],
  pricing_unit: String,

  related_component: String,
  insertion_rule: String,

  battery_type: String,
  minimum_reserve_percentage: Number,
  round_trip_efficiency: Number,

  inverter_type: String,

  manufacturer_id: Types.ObjectId,

  dimensions: DimensionSchema,

  ratings: RatingSchema,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

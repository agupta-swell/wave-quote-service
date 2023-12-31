import { Schema, Types } from 'mongoose';
import { IUnknownProduct } from '../interfaces';
import { DimensionSchema } from './dimension.schema';
import { RatingSchema } from './rating.schema';

export const ProductSchema = new Schema<IUnknownProduct>({
  name: String,
  type: String,
  part_numbers: [String],
  pricing_unit: String,
  cost: Number,

  description: String,

  insertion_rule: String,

  battery_type: String,
  minimum_reserve_percentage: Number,
  round_trip_efficiency: Number,

  inverter_type: String,
  inverter_efficiency: Number,
  is_default_inverter: Boolean,

  manufacturer_id: Types.ObjectId,
  manufacturer_warranty_period: Number,

  dimensions: DimensionSchema,

  ratings: RatingSchema,

  product_image: String,
  product_data_sheet: String,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

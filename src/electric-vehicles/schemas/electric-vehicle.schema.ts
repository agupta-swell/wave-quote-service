import { Schema } from 'mongoose';

export const ElectricVehicleSchema = new Schema({
  manufacturer: String,
  model: String,
  battery_kwh: Number,
  kwh_per_100_miles: Number,
  created_at: Date,
  updated_at: Date,
  created_by: String,
  updated_by: String,
});

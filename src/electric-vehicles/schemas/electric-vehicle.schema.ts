import { Schema } from 'mongoose';

export const ElectricVehicleSchema = new Schema({
  manufacturer: String,
  model: String,
  battery_kwh: Number,
  mpge: Number,
  created_at: Date,
  updated_at: Date,
  created_by: String,
  updated_by: String,
});

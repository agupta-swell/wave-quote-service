import { Document, Schema } from 'mongoose';

export const SOLAR_PANEL = Symbol('SolarPanel').toString();

export interface SolarPanel extends Document {
  readonly name: string;
  readonly width: number;
  readonly length: number;
  readonly unit: string;
  readonly created_at: Date;
  readonly updated_at: Date;
}

export const SolarPanelSchema = new Schema({
  name: String,
  width: Number,
  length: Number,
  unit: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

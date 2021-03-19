import { Document, Schema } from 'mongoose';

export const GS_PROGRAMS = Symbol('GS_PROGRAMS').toString();

export interface GsPrograms extends Document {
  annualIncentives: number;
  termYears: string;
  numberBatteries: string;
  upfrontIncentives: number;
  utilityProgramId: string;

  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
}

export const GsProgramsSchema = new Schema<GsPrograms>({
  // follow wave_1 schema
  _id: Schema.Types.Mixed,
  annualIncentives: Number,
  termYears: String,
  numberBatteries: String,
  upfrontIncentives: Number,
  utilityProgramId: String,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

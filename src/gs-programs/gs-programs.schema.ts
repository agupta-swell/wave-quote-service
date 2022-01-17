import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';

export const GS_PROGRAMS = Symbol('GS_PROGRAMS').toString();

export interface GsPrograms extends Document {
  id: string;
  annualIncentives: number;
  termYears: string;
  kilowattHours: number;
  upfrontIncentives: number;
  utilityProgramId: string;
  manufacturerId: string;

  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
}

export const GsProgramsSchema = new Schema<GsPrograms>({
  // follow wave_1 schema
  _id: Schema.Types.Mixed,
  id: String,
  annualIncentives: Number,
  termYears: String,
  kilowattHours: Number,
  upfrontIncentives: Number,
  utilityProgramId: String,
  manufacturerId: String,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

MongooseNamingStrategy.ExcludeOne(GsProgramsSchema);

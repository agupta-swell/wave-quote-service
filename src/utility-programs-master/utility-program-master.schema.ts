import {} from 'dayjs';
import { Document, Schema } from 'mongoose';

export const UTILITY_PROGRAM_MASTER = Symbol('UTILITY_PROGRAM_MASTER').toString();

export interface UtilityProgramMaster extends Document {
  utilityProgramName: string;
  programManagerId?: string;
  gsaDisplayName: string;
  isActive: boolean;
  endDate: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;

}

export const UtilityProgramMasterSchema = new Schema<UtilityProgramMaster>({
  utility_program_name: String,
  gsa_display_name: String,
  program_manager_id: String,
  is_active: Boolean,
  end_date: Date,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

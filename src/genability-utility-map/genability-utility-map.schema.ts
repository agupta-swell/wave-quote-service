import { Document, Schema } from 'mongoose';

export const GENABILITY_UTILITY_MAP_MODEL = 'v2_genability_utility_map';
export const GENABILITY_UTILITY_MAP_COLL = 'v2_genability_utility_map';

export interface GenabilityUtilityMap extends Document {
  _id: string;
  genabilityLseName: string;
  waveUtilityCode: string;
}

export const GenabilityUtilityMapSchema = new Schema<GenabilityUtilityMap>({
  _id: String,
  genability_lse_name: String,
  wave_utility_code: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

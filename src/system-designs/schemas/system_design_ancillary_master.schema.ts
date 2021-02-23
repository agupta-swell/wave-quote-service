import { Document, Schema } from 'mongoose';
import { COMPONENT_TYPE } from '../constants';

export const SYSTEM_DESIGN_ANCILLARY_MASTER = Symbol('SYSTEM_DESIGN_ANCILLARY_MASTER').toString();

export interface SystemDesignAncillaryMaster extends Document {
  manufacturer_id: string;
  model_name: string;
  related_component: COMPONENT_TYPE;
  description: string;
  average_whole_sale_price: number;
  applicable_product_manufacturer_id: string;

  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const SystemDesignAncillaryMasterSchema = new Schema<SystemDesignAncillaryMaster>({
  manufacturer_id: String,
  model_name: String,
  related_component: String,
  description: String,
  average_whole_sale_price: Number,
  applicable_product_manufacturer_id: String,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

import { Document, Schema } from 'mongoose';
import { COMPONENT_CATEGORY_TYPE, COMPONENT_TYPE, COST_UNIT_TYPE } from 'src/system-designs/constants';
import { BATTERY_TYPE, INVERTER_TYPE, PANEL_OUTPUT_MODE, PV_WATT_MODULE_TYPE } from './constants';

export const PRODUCT = Symbol('Product').toString();

export interface IPanelProduct {
  pv_watt_module_type: PV_WATT_MODULE_TYPE;
  panel_output_mode: PANEL_OUTPUT_MODE;
  watt_class_stcdc: number;
}

export interface IInverterProduct {
  inverter_type: INVERTER_TYPE;
}

export interface IBatteryProduct {
  battery_type: BATTERY_TYPE;
}

export interface IBOSProduct {
  related_component: COMPONENT_TYPE;
  related_component_category: COMPONENT_CATEGORY_TYPE;
  unit: COST_UNIT_TYPE;
}

export interface Product extends Document, IPanelProduct, IInverterProduct, IBatteryProduct, IBOSProduct {
  manufacturer: string;
  name: string;
  type: string;
  price: number; // averageWholesalePrice
  sizeW: number;
  sizekWh: number;
  partNumber: string[];
  dimension: {
    length: number;
    width: number;
  };
  created_at: Date;
  updated_at: Date;
  // add new fields
  model_name: string;
  approved_for_gsa: boolean;
  approved_for_esa: boolean;
}

export const ProductSchema = new Schema<Product>({
  _id: Schema.Types.Mixed,
  manufacturer: String,
  name: String,
  type: String,
  price: Number,
  sizeW: Number,
  sizekWh: Number,
  dimension: {
    length: Number,
    width: Number,
  },
  partNumber: [String],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'mongoose-schema-mapper';
import { COMPONENT_CATEGORY_TYPE, COMPONENT_TYPE, COST_UNIT_TYPE } from 'src/system-designs/constants';
import { BATTERY_TYPE, INVERTER_TYPE, PANEL_OUTPUT_MODE, PV_WATT_MODULE_TYPE } from './constants';

export const PRODUCT = Symbol('Product').toString();

export interface IPanelProduct {
  pvWattModuleType: PV_WATT_MODULE_TYPE;
  panelOutputMode: PANEL_OUTPUT_MODE;
  wattClassStcdc: number;
}

export interface IInverterProduct {
  inverterType: INVERTER_TYPE;
}

export interface IBatteryProduct {
  batteryType: BATTERY_TYPE;
}

export interface IBalanceOfSystemProduct {
  relatedComponent: COMPONENT_TYPE;
  relatedComponentCategory: COMPONENT_CATEGORY_TYPE;
  unit: COST_UNIT_TYPE;
}

export interface Product extends Document, IPanelProduct, IInverterProduct, IBatteryProduct, IBalanceOfSystemProduct {
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
  createdAt: Date;
  updatedAt: Date;
  // add new fields
  manufacturerId: string;
  modelName: string;
  approvedForGsa: boolean;
  approvedForEsa: boolean;
  insertionRule?: string | null;
}

export const ProductSchema = new Schema<Product>({
  _id: Schema.Types.Mixed,
  manufacturerId: String,
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
  // for panel
  pv_watt_module_type: String,
  panel_output_mode: String,
  watt_class_stcdc: Number,
  // for inverter
  inverterType: String,
  // for storage
  battery_type: String,
  // for BOS
  relatedComponent: String,
  relatedComponentCategory: String,
  insertion_rule: String,
  unit: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

MongooseNamingStrategy.AddExclusion(ProductSchema, 'partNumber');

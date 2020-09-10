import { Document, Schema, Types } from 'mongoose';
import { toSnakeCase } from '../utils/transformProperties';
import { CreateSystemDesignDto, RoofTopDataDto } from './req';

export const SYSTEM_DESIGN = Symbol('SystemDesign').toString();

export interface ILatLngSchema {
  lat: number;
  lng: number;
}

const LatLngSchema = new Schema<ILatLngSchema>(
  {
    lat: Number,
    lng: Number,
  },
  { _id: false },
);

export interface IProductSchema {
  name: string;
  type: string;
  price: number;
  sizeW: number;
  sizekWh: number;
  part_number: string[];
  dimension: {
    length: number;
    width: number;
  };
}

const ProductSchema = new Schema<IProductSchema>(
  {
    name: String,
    type: String,
    price: Number,
    sizeW: Number,
    sizekWh: Number,
    part_number: [String],
    dimension: {
      length: Number,
      width: Number,
    },
  },
  { _id: false },
);

export interface ISolarPanelArraySchema {
  array_id: Types.ObjectId;
  primary_orientation_side: number;
  panel_orientation: string;
  bound_polygon: ILatLngSchema[];
  panels: ILatLngSchema[][];
  setbacks: Object;
  setbacks_polygon: ILatLngSchema[];
  // FIXME: need to change type
  keepouts: ILatLngSchema[][];
  pitch: number;
  azimuth: number;
  row_spacing: number;
  panel_model_id: string;
  number_of_panels: number;
  panel_model_data_snapshot: IProductSchema;
  panel_model_snapshot_date: Date;
}

const SolarPanelArraySchema = new Schema<ISolarPanelArraySchema>(
  {
    array_id: Schema.Types.ObjectId,
    primary_orientation_side: Number,
    panel_orientation: String,
    bound_polygon: [LatLngSchema],
    panels: [[LatLngSchema]],
    setbacks: Object,
    setbacks_polygon: [LatLngSchema],
    // FIXME: need to change type
    keepouts: [[LatLngSchema]],
    pitch: Number,
    azimuth: Number,
    row_spacing: Number,
    panel_model_id: String,
    number_of_panels: Number,
    panel_model_data_snapshot: ProductSchema,
    panel_model_snapshot_date: Date,
  },
  { _id: false },
);

export interface IInverterSchema {
  type: string;
  solar_panel_array_id: string;
  inverter_model_data_snapshot: IProductSchema;
  inverter_model_snapshot_date: Date;
}

const InverterSchema = new Schema<IInverterSchema>(
  {
    type: String,
    solar_panel_array_id: String,
    inverter_model_data_snapshot: ProductSchema,
    inverter_model_snapshot_date: Date,
  },
  { _id: false },
);

export interface IStorageSchema {
  type: string;
  quantity: number;
  storage_model_data_snapshot: IProductSchema;
  storage_model_snapshot_date: Date;
}

const StorageSchema = new Schema<IStorageSchema>(
  {
    type: String,
    quantity: Number,
    storage_model_data_snapshot: ProductSchema,
    storage_model_snapshot_date: Date,
  },
  { _id: false },
);

export interface IRoofTopSchema {
  panel_array: ISolarPanelArraySchema[];
  inverters: IInverterSchema[];
  storage: IStorageSchema[];
}

const RoofTopSchema = new Schema<IRoofTopSchema>(
  {
    panel_array: [SolarPanelArraySchema],
    inverters: [InverterSchema],
    storage: [StorageSchema],
  },
  { _id: false },
);

export interface ISystemProductionSchema {
  capacityKW: number;
  generationKWh: number;
  productivity: number;
  annual_usageKWh: number;
  offset_percentage: number;
}

const SystemProductionSchema = new Schema<ISystemProductionSchema>(
  {
    capacityKW: Number,
    generationKWh: Number,
    productivity: Number,
    annual_usageKWh: Number,
    offset_percentage: Number,
  },
  { _id: false },
);

export const SystemDesignSchema = new Schema<SystemDesign>({
  name: String,
  latitude: Number,
  longtitude: Number,
  opportunity_id: String,
  design_mode: String,
  thumbnail: String,
  roof_top_design_data: RoofTopSchema,
  // TODO: implement later
  capacity_production_design_data: String,
  system_production_data: SystemProductionSchema,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

export interface SystemDesign extends Document {
  name: string;
  opportunity_id: string;
  design_mode: string;
  thumbnail: string;
  roof_top_design_data: IRoofTopSchema;
  capacity_production_design_data: '';
  system_production_data: ISystemProductionSchema;
  latitude: number;
  longtitude: number;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export class SystemDesignModel {
  name: string;
  latitude: number;
  longtitude: number;
  opportunity_id: string;
  design_mode: string;
  thumbnail: string;
  roof_top_design_data: IRoofTopSchema;
  capacity_production_design_data: string;
  system_production_data: ISystemProductionSchema;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;

  constructor(systemDesign: CreateSystemDesignDto) {
    this.name = systemDesign.name;
    this.latitude = systemDesign.latitude;
    this.longtitude = systemDesign.longtitude;
    this.opportunity_id = systemDesign.opportunityId;
    this.design_mode = systemDesign.designMode;
    this.roof_top_design_data = this.transformRoofTopData(systemDesign.roofTopDesignData);
    this.capacity_production_design_data = systemDesign.capacityProductionDesignData as any;
  }

  transformRoofTopData = (data: RoofTopDataDto): IRoofTopSchema => {
    const { inverters, storage, panelArray } = data;
    return {
      panel_array: panelArray.map(item => toSnakeCase(item)),
      inverters: inverters.map(item => toSnakeCase(item)),
      storage: storage.map(item => toSnakeCase(item)),
    };
  };

  setPanelModelDataSnapshot(panelModelData: IProductSchema, index: number) {
    this.roof_top_design_data.panel_array[index].panel_model_data_snapshot = panelModelData;
  }

  setThumbnail(link: string) {
    this.thumbnail = link;
  }

  setSystemProductionData(data: ISystemProductionSchema) {
    this.system_production_data = data;
  }
}

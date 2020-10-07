import { Document, Schema, Types } from 'mongoose';
import { toSnakeCase } from '../utils/transformProperties';
import { CreateSystemDesignDto, RoofTopDataReqDto } from './req';

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

export const ProductSchema = new Schema<IProductSchema>(
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

export interface IDiscountDetails {
  amount: number;
  description: string;
}

const DiscountDetailsSchema = new Schema<IDiscountDetails>({
  amount: Number,
  description: String,
});

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
  inverter_model_id: string;
  inverter_model_data_snapshot: IProductSchema;
  inverter_model_snapshot_date: Date;
  quantity: number;
}

const InverterSchema = new Schema<IInverterSchema>(
  {
    type: String,
    inverter_model_id: String,
    inverter_model_data_snapshot: ProductSchema,
    inverter_model_snapshot_date: Date,
    quantity: Number,
  },
  { _id: false },
);

export interface IStorageSchema {
  type: string;
  quantity: number;
  storage_model_id: string;
  storage_model_data_snapshot: IProductSchema;
  storage_model_snapshot_date: Date;
  reserve: number;
  purpose: string;
}

const StorageSchema = new Schema<IStorageSchema>(
  {
    type: String,
    quantity: Number,
    storage_model_id: String,
    storage_model_data_snapshot: ProductSchema,
    storage_model_snapshot_date: Date,
    reserve: Number,
    purpose: String,
  },
  { _id: false },
);

export interface IAdderModel {
  adder: string;
  price: number;
  increment: string | any;
  modified_at: Date;
}

export const AdderModelSchema = new Schema<IAdderModel>(
  {
    adder: String,
    price: Number,
    increment: String,
    modified_at: Date,
  },
  { _id: false },
);

export interface IAdderSchema {
  adder_description: string;
  quantity: number;
  adder_id: string;
  adder_model_data_snapshot: IAdderModel;
  adder_model_snapshot_date: Date;
}

const AdderSchema = new Schema<IAdderSchema>(
  {
    adder_description: String,
    quantity: Number,
    adder_id: String,
    adder_model_data_snapshot: AdderModelSchema,
    adder_model_snapshot_date: Date,
  },
  { _id: false },
);

export interface IRoofTopSchema {
  panel_array: ISolarPanelArraySchema[];
  inverters: IInverterSchema[];
  storage: IStorageSchema[];
  adders: IAdderSchema[];
}

export const RoofTopSchema = new Schema<IRoofTopSchema>(
  {
    panel_array: [SolarPanelArraySchema],
    inverters: [InverterSchema],
    storage: [StorageSchema],
    adders: [AdderSchema],
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

export const SystemProductionSchema = new Schema<ISystemProductionSchema>(
  {
    capacityKW: Number,
    generationKWh: Number,
    productivity: Number,
    annual_usageKWh: Number,
    offset_percentage: Number,
  },
  { _id: false },
);

export interface SystemDesign extends Document {
  name: string;
  opportunity_id: string;
  design_mode: string;
  thumbnail: string;
  is_selected: boolean;
  is_solar: boolean;
  is_retrofit: boolean;
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

export const SystemDesignSchema = new Schema<SystemDesign>({
  name: String,
  latitude: Number,
  longtitude: Number,
  opportunity_id: String,
  design_mode: String,
  thumbnail: String,
  is_selected: Boolean,
  is_solar: Boolean,
  is_retrofit: Boolean,
  roof_top_design_data: RoofTopSchema,
  // TODO: implement later
  capacity_production_design_data: String,
  system_production_data: SystemProductionSchema,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

export class SystemDesignModel {
  _id: string;
  name: string;
  latitude: number;
  longtitude: number;
  opportunity_id: string;
  design_mode: string;
  thumbnail: string;
  is_selected: boolean;
  is_solar: boolean;
  is_retrofit: boolean;
  roof_top_design_data: IRoofTopSchema;
  capacity_production_design_data: string;
  system_production_data: ISystemProductionSchema;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;

  constructor(systemDesign: CreateSystemDesignDto) {
    this.name = systemDesign.name;
    this.is_selected = systemDesign.isSelected;
    this.is_solar = systemDesign.isSolar;
    this.is_retrofit = systemDesign.isRetrofit;
    this.latitude = systemDesign.latitude;
    this.longtitude = systemDesign.longtitude;
    this.opportunity_id = systemDesign.opportunityId;
    this.design_mode = systemDesign.designMode;
    this.roof_top_design_data =
      systemDesign.roofTopDesignData && this.transformRoofTopData(systemDesign.roofTopDesignData);
    this.capacity_production_design_data = systemDesign.capacityProductionDesignData as any;
  }

  transformRoofTopData = (data: RoofTopDataReqDto): IRoofTopSchema => {
    const { inverters, storage, panelArray, adders } = data;
    return {
      panel_array: panelArray.map(item => toSnakeCase(item)),
      inverters: inverters.map(item => toSnakeCase(item)),
      storage: storage.map(item => toSnakeCase(item)),
      adders: adders.map(item => toSnakeCase(item)),
    };
  };

  setPanelModelDataSnapshot(panelModelData: IProductSchema, index: number) {
    this.roof_top_design_data.panel_array[index].panel_model_data_snapshot = panelModelData;
    this.roof_top_design_data.panel_array[index].panel_model_snapshot_date = new Date();
  }

  setAdder(adder: IAdderModel, index: number) {
    this.roof_top_design_data.adders[index].adder_model_data_snapshot = adder;
    this.roof_top_design_data.adders[index].adder_model_snapshot_date = new Date();
  }

  setInverter(inverter: IProductSchema, index: number) {
    this.roof_top_design_data.inverters[index].inverter_model_data_snapshot = inverter;
    this.roof_top_design_data.inverters[index].inverter_model_snapshot_date = new Date();
  }

  setStorage(storage: IProductSchema, index: number) {
    this.roof_top_design_data.storage[index].storage_model_data_snapshot = storage;
    this.roof_top_design_data.storage[index].storage_model_snapshot_date = new Date();
  }

  setThumbnail(link: string) {
    this.thumbnail = link;
  }

  setIsSelected(isSelected: boolean) {
    this.is_selected = isSelected;
  }

  setIsSolar(isSolar: boolean) {
    this.is_selected = isSolar;
  }

  setIsRetrofit(isRetrofit: boolean) {
    this.is_selected = isRetrofit;
  }
  setSystemProductionData(data: ISystemProductionSchema) {
    this.system_production_data = data;
  }
}

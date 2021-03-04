import { Document, Schema, Types } from 'mongoose';
import { IBalanceOfSystemProduct, IBatteryProduct, IInverterProduct, IPanelProduct } from 'src/products/product.schema';
import { IUtilityCostData, UtilityCostDataSchema } from '../utilities/utility.schema';
import { toSnakeCase } from '../utils/transformProperties';
import { COMPONENT_TYPE, COST_UNIT_TYPE } from './constants';
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

interface IProductCommonSchema {
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
  manufacturer_id: string;
  model_name: string;
  approved_for_gsa: boolean;
  approved_for_esa: boolean;
}

export interface IStorageProductSchema extends IProductCommonSchema, IBatteryProduct {}

export const StorageProductSchema = new Schema<IStorageProductSchema>(
  {
    manufacturer_id: String,
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
    model_name: String,
    approved_for_gsa: Boolean,
    approved_for_esa: Boolean,
    battery_type: String,
  },
  { _id: false },
);

export interface IInverterProductSchema extends IProductCommonSchema, IInverterProduct {}

export const InverterProductSchema = new Schema<IInverterProductSchema>(
  {
    manufacturer_id: String,
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
    model_name: String,
    approved_for_gsa: Boolean,
    approved_for_esa: Boolean,
    inverter_type: String,
  },
  { _id: false },
);

export interface IPanelProductSchema extends IProductCommonSchema, IPanelProduct {}

export const PanelProductSchema = new Schema<IPanelProductSchema>(
  {
    manufacturer_id: String,
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
    model_name: String,
    approved_for_gsa: Boolean,
    approved_for_esa: Boolean,
    pv_watt_module_type: String,
    panel_output_mode: String,
    watt_class_stcdc: Number,
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
  keepouts: ILatLngSchema[][];
  pitch: number;
  azimuth: number;
  row_spacing: number;
  panel_model_id: string;
  number_of_panels: number;
  panel_model_data_snapshot: IPanelProductSchema;
  panel_model_snapshot_date: Date;
  shading_percentage: number;
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
    keepouts: [[LatLngSchema]],
    pitch: Number,
    azimuth: Number,
    row_spacing: Number,
    panel_model_id: String,
    number_of_panels: Number,
    panel_model_data_snapshot: PanelProductSchema,
    panel_model_snapshot_date: Date,
    shading_percentage: Number,
  },
  { _id: false },
);

export interface IInverterSchema {
  type: string;
  inverter_model_id: string;
  inverter_model_data_snapshot: IInverterProductSchema;
  inverter_model_snapshot_date: Date;
  quantity: number;
}

const InverterSchema = new Schema<IInverterSchema>(
  {
    type: String,
    inverter_model_id: String,
    inverter_model_data_snapshot: InverterProductSchema,
    inverter_model_snapshot_date: Date,
    quantity: Number,
  },
  { _id: false },
);

export interface IStorageSchema {
  type: string;
  quantity: number;
  storage_model_id: string;
  storage_model_data_snapshot: IStorageProductSchema;
  storage_model_snapshot_date: Date;
  reserve: number;
  purpose: string;
}

const StorageSchema = new Schema<IStorageSchema>(
  {
    type: String,
    quantity: Number,
    storage_model_id: String,
    storage_model_data_snapshot: StorageProductSchema,
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
  unit: COST_UNIT_TYPE;
  adder_id: string;
  adder_model_data_snapshot: IAdderModel;
  adder_model_snapshot_date: Date;
}

const AdderSchema = new Schema<IAdderSchema>(
  {
    adder_description: String,
    quantity: Number,
    adder_id: String,
    unit: String,
    adder_model_data_snapshot: AdderModelSchema,
    adder_model_snapshot_date: Date,
  },
  { _id: false },
);

export interface IBalanceOfSystemProductSchema extends IProductCommonSchema, IBalanceOfSystemProduct {}

export const BalanceOfSystemProductSchema = new Schema<IBalanceOfSystemProductSchema>(
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
    manufacturer_id: String,
    model_name: String,
    approved_for_gsa: Boolean,
    approved_for_esa: Boolean,
    unit: String,
    related_component_category: String,
    inverter_type: String,
    related_component: String,
  },
  { _id: false },
);

export interface IBalanceOfSystemSchema {
  balance_of_system_id: string;
  balance_of_system_model_data_snapshot: IBalanceOfSystemProductSchema;
  balance_of_system_snapshot_date: Date;
  unit: COST_UNIT_TYPE;
}

export const BalanceOfSystemSchema = new Schema<IBalanceOfSystemSchema>(
  {
    balance_of_system_id: String,
    balance_of_system_model_data_snapshot: BalanceOfSystemProductSchema,
    balance_of_system_snapshot_date: Date,
    unit: String,
  },
  { _id: false },
);

export interface IAncillaryEquipment {
  ancillary_id: string;
  manufacturer_id: string;
  model_name: string;
  related_component: COMPONENT_TYPE;
  description: string;
  average_whole_sale_price: number;
  applicable_product_manufacturer_id: string;
}

export const AncillaryEquipment = new Schema<IAncillaryEquipment>(
  {
    ancillary_id: String,
    manufacturer_id: String,
    model_name: String,
    related_component: String,
    description: String,
    average_whole_sale_price: Number,
    applicable_product_manufacturer_id: String,
  },
  { _id: false },
);

export interface IAncillaryEquipmentSchema {
  ancillary_id: string;
  ancillary_equipment_model_data_snapshot: IAncillaryEquipment;
  ancillary_equipment_model_data_snapshot_date: Date;
  quantity: number;
}

export const AncillaryEquipmentSchema = new Schema<IAncillaryEquipmentSchema>(
  {
    ancillary_id: String,
    ancillary_equipment_model_data_snapshot: AncillaryEquipment,
    ancillary_equipment_model_data_snapshot_date: Date,
    quantity: Number,
  },
  { _id: false },
);

export interface IRoofTopSchema {
  panel_array: ISolarPanelArraySchema[];
  inverters: IInverterSchema[];
  storage: IStorageSchema[];
  adders: IAdderSchema[];
  balance_of_systems: IBalanceOfSystemSchema[];
  ancillary_equipments: IAncillaryEquipmentSchema[];
}

export const RoofTopSchema = new Schema<IRoofTopSchema>(
  {
    panel_array: [SolarPanelArraySchema],
    inverters: [InverterSchema],
    storage: [StorageSchema],
    adders: [AdderSchema],
    balance_of_systems: [BalanceOfSystemSchema],
    ancillary_equipments: [AncillaryEquipmentSchema],
  },
  { _id: false },
);

export interface ISystemProductionSchema {
  capacityKW: number;
  generationKWh: number;
  productivity: number;
  annual_usageKWh: number;
  offset_percentage: number;
  generationMonthlyKWh: number[];
}

export const SystemProductionSchema = new Schema<ISystemProductionSchema>(
  {
    capacityKW: Number,
    generationKWh: Number,
    productivity: Number,
    annual_usageKWh: Number,
    offset_percentage: Number,
    generationMonthlyKWh: [Number],
  },
  { _id: false },
);

export interface INetUsagePostInstallationSchema {
  hourly_net_usage: number[];
  calculation_mode: string;
}

export const NetUsagePostInstallationSchema = new Schema<INetUsagePostInstallationSchema>(
  {
    hourly_net_usage: [Number],
    calculation_mode: String,
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
  net_usage_post_installation: INetUsagePostInstallationSchema;
  cost_post_installation: IUtilityCostData;
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
  net_usage_post_installation: NetUsagePostInstallationSchema,
  cost_post_installation: UtilityCostDataSchema,
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

  net_usage_post_installation: INetUsagePostInstallationSchema;

  cost_post_installation: IUtilityCostData;

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
    const { inverters, storage, panelArray, adders, balanceOfSystems, ancillaryEquipments } = data;
    return {
      panel_array: (panelArray || []).map(item => toSnakeCase(item)),
      inverters: inverters.map(item => toSnakeCase(item)),
      storage: storage.map(item => toSnakeCase(item)),
      adders: adders.map(item => toSnakeCase(item)),
      balance_of_systems: balanceOfSystems.map(item => toSnakeCase(item)),
      ancillary_equipments: ancillaryEquipments.map(item => toSnakeCase(item)),
    };
  };

  setPanelModelDataSnapshot(panelModelData: IPanelProductSchema, index: number) {
    this.roof_top_design_data.panel_array[index].panel_model_data_snapshot = panelModelData;
    this.roof_top_design_data.panel_array[index].panel_model_snapshot_date = new Date();
  }

  setAdder(adder: IAdderModel, unit: COST_UNIT_TYPE, index: number) {
    this.roof_top_design_data.adders[index].adder_model_data_snapshot = adder;
    this.roof_top_design_data.adders[index].unit = unit;
    this.roof_top_design_data.adders[index].adder_model_snapshot_date = new Date();
  }

  setInverter(inverter: IInverterProductSchema, index: number) {
    this.roof_top_design_data.inverters[index].inverter_model_data_snapshot = inverter;
    this.roof_top_design_data.inverters[index].inverter_model_snapshot_date = new Date();
  }

  setStorage(storage: IStorageProductSchema, index: number) {
    this.roof_top_design_data.storage[index].storage_model_data_snapshot = storage;
    this.roof_top_design_data.storage[index].storage_model_snapshot_date = new Date();
  }

  setBalanceOfSystem(balanceOfSystems: IBalanceOfSystemProductSchema, index: number) {
    this.roof_top_design_data.balance_of_systems[index].balance_of_system_model_data_snapshot = balanceOfSystems;
    this.roof_top_design_data.balance_of_systems[index].balance_of_system_snapshot_date = new Date();
  }

  setAncillaryEquipment(ancillaryEquipment: IAncillaryEquipment, index: number) {
    this.roof_top_design_data.ancillary_equipments[index].ancillary_equipment_model_data_snapshot = ancillaryEquipment;
    this.roof_top_design_data.ancillary_equipments[index].ancillary_equipment_model_data_snapshot_date = new Date();
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

  setNetUsagePostInstallation(data: INetUsagePostInstallationSchema) {
    this.net_usage_post_installation = data;
  }

  setCostPostInstallation(data: IUtilityCostData) {
    this.cost_post_installation = data;
  }

  transformUnit() {}
}

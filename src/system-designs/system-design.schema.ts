import { Document, Schema, Types } from 'mongoose';
import { BATTERY_TYPE } from 'src/products/constants';
import { IBalanceOfSystemProduct, IBatteryProduct, IInverterProduct, IPanelProduct } from 'src/products/product.schema';
import { IUtilityCostData, UtilityCostDataSchema } from '../utilities/utility.schema';
import { COMPONENT_TYPE, COST_UNIT_TYPE, DESIGN_MODE } from './constants';
import { CapacityProductionDataDto, CreateSystemDesignDto, RoofTopDataReqDto } from './req';

export const SYSTEM_DESIGN = Symbol('SystemDesign').toString();

export interface ILatLngSchema {
  lat: number;
  lng: number;
}

const LatLngSchema = new Schema<Document<ILatLngSchema>>(
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
  partNumber: string[];
  dimension: {
    length: number;
    width: number;
  };
  manufacturerId: string;
  modelName: string;
  approvedForGsa: boolean;
  approvedForEsa: boolean;
}

export interface IStorageProductSchema extends IProductCommonSchema, IBatteryProduct {}

export const StorageProductSchema = new Schema<Document<IStorageProductSchema>>(
  {
    manufacturerId: String,
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

export const InverterProductSchema = new Schema<Document<IInverterProductSchema>>(
  {
    manufacturerId: String,
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

export const PanelProductSchema = new Schema<Document<IPanelProductSchema>>(
  {
    manufacturerId: String,
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

export interface ISystemProductionSchema {
  capacityKW: number;
  generationKWh: number;
  productivity: number;
  annualUsageKWh: number;
  offsetPercentage: number;
  generationMonthlyKWh: number[];
}

export const SystemProductionSchema = new Schema<Document<ISystemProductionSchema>>(
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

export interface ISolarPanelArraySchema {
  arrayId: Types.ObjectId;
  primaryOrientationSide: number;
  panelOrientation: string;
  boundPolygon: ILatLngSchema[];
  panels: ILatLngSchema[][];
  setbacks: Map<string, string>;
  setbacksPolygon: ILatLngSchema[];
  keepouts: ILatLngSchema[][];
  pitch: number;
  azimuth: number;
  rowSpacing: number;
  panelModelId: string;
  numberOfPanels: number;
  panelModelDataSnapshot: IPanelProductSchema;
  panelModelSnapshotDate: Date;
  losses: number;
}

export interface ICapacityPanelArraySchema extends ISolarPanelArraySchema {
  capacity: number;
  production: number;
  systemProductionData: ISystemProductionSchema;
}

const SolarPanelArraySchema = new Schema<Document<ISolarPanelArraySchema>>(
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
    losses: Number,
  },
  { _id: false },
);

const CapacityPanelArraySchema = new Schema<Document<ICapacityPanelArraySchema>>(
  {
    array_id: Schema.Types.ObjectId,
    capacity: Number,
    production: Number,
    pitch: Number,
    azimuth: Number,
    panel_model_id: String,
    number_of_panels: Number,
    panel_model_data_snapshot: PanelProductSchema,
    panel_model_snapshot_date: Date,
    losses: Number,
    system_production_data: SystemProductionSchema,
  },
  { _id: false },
);

export interface IInverterSchema {
  type: string;
  inverterModelId: string;
  inverterModelDataSnapshot: IInverterProductSchema;
  inverterModelSnapshotDate: Date;
  quantity: number;
  arrayId: Types.ObjectId;
}

const InverterSchema = new Schema<Document<IInverterSchema>>(
  {
    type: String,
    inverter_model_id: String,
    inverter_model_data_snapshot: InverterProductSchema,
    inverter_model_snapshot_date: Date,
    quantity: Number,
    array_id: Schema.Types.ObjectId,
  },
  { _id: false },
);

export interface IStorageSchema {
  type: string;
  quantity: number;
  storageModelId: string;
  storageModelDataSnapshot: IStorageProductSchema;
  storageModelSnapshotDate: Date;
  reserve: number;
  purpose: string;
  batteryType: BATTERY_TYPE;
}

const StorageSchema = new Schema<Document<IStorageSchema>>(
  {
    type: String,
    quantity: Number,
    storage_model_id: String,
    storage_model_data_snapshot: StorageProductSchema,
    storage_model_snapshot_date: Date,
    reserve: Number,
    purpose: String,
    battery_type: String,
  },
  { _id: false },
);

export interface IAdderModel {
  adder: string;
  price: number;
  increment: string | any;
  modifiedAt: Date;
}

export const AdderModelSchema = new Schema<Document<IAdderModel>>(
  {
    adder: String,
    price: Number,
    increment: String,
    modified_at: Date,
  },
  { _id: false },
);

export interface IAdderSchema {
  adderDescription: string;
  quantity: number;
  unit: COST_UNIT_TYPE;
  adderId: string;
  adderModelDataSnapshot: IAdderModel;
  adderModelSnapshotDate: Date;
}

const AdderSchema = new Schema<Document<IAdderSchema>>(
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

export const BalanceOfSystemProductSchema = new Schema<Document<IBalanceOfSystemProductSchema>>(
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
    manufacturerId: String,
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
  balanceOfSystemId: string;
  balanceOfSystemModelDataSnapshot: IBalanceOfSystemProductSchema;
  balanceOfSystemSnapshotDate: Date;
  unit: COST_UNIT_TYPE;
}

export const BalanceOfSystemSchema = new Schema<Document<IBalanceOfSystemSchema>>(
  {
    balance_of_system_id: String,
    balance_of_system_model_data_snapshot: BalanceOfSystemProductSchema,
    balance_of_system_snapshot_date: Date,
    unit: String,
  },
  { _id: false },
);

export interface IAncillaryEquipment {
  ancillaryId: string;
  manufacturerId: string;
  modelName: string;
  relatedComponent: COMPONENT_TYPE;
  description: string;
  averageWholeSalePrice: number;
  applicableProductManufacturerId: string;
  quantity: number;
}

export const AncillaryEquipment = new Schema<Document<IAncillaryEquipment>>(
  {
    ancillary_id: String,
    manufacturer_id: String,
    model_name: String,
    related_component: String,
    description: String,
    average_whole_sale_price: Number,
    applicable_product_manufacturer_id: String,
    quantity: Number,
  },
  { _id: false },
);

export interface IAncillaryEquipmentSchema {
  ancillaryId: string;
  ancillaryEquipmentModelDataSnapshot: IAncillaryEquipment;
  ancillaryEquipmentModelDataSnapshotDate: Date;
  quantity: number;
}

export const AncillaryEquipmentSchema = new Schema<Document<IAncillaryEquipmentSchema>>(
  {
    ancillary_id: String,
    ancillary_equipment_model_data_snapshot: AncillaryEquipment,
    ancillary_equipment_model_data_snapshot_date: Date,
    quantity: Number,
  },
  { _id: false },
);

export interface IRoofTopSchema {
  panelArray: ISolarPanelArraySchema[];
  inverters: IInverterSchema[];
  storage: IStorageSchema[];
  adders: IAdderSchema[];
  balanceOfSystems: IBalanceOfSystemSchema[];
  ancillaryEquipments: IAncillaryEquipmentSchema[];
}

export interface ICapacityProductionSchema {
  panelArray: ICapacityPanelArraySchema[];
  inverters: IInverterSchema[];
  storage: IStorageSchema[];
  adders: IAdderSchema[];
  balanceOfSystems: IBalanceOfSystemSchema[];
  ancillaryEquipments: IAncillaryEquipmentSchema[];
}

export const RoofTopSchema = new Schema<Document<IRoofTopSchema>>(
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

export const CapacityProductionSchema = new Schema<Document<ICapacityProductionSchema>>(
  {
    panel_array: [CapacityPanelArraySchema],
    inverters: [InverterSchema],
    storage: [StorageSchema],
    adders: [AdderSchema],
    balance_of_systems: [BalanceOfSystemSchema],
    ancillary_equipments: [AncillaryEquipmentSchema],
  },
  { _id: false },
);

export interface INetUsagePostInstallationSchema {
  hourlyNetUsage: number[];
  calculationMode: string;
}

export const NetUsagePostInstallationSchema = new Schema<Document<INetUsagePostInstallationSchema>>(
  {
    hourly_net_usage: [Number],
    calculation_mode: String,
  },
  { _id: false },
);

// @ts-ignore
export interface SystemDesign extends Document {
  name: string;
  opportunityId: string;
  designMode: string;
  thumbnail: string;
  isSelected: boolean;
  isSolar: boolean;
  isRetrofit: boolean;
  roofTopDesignData: IRoofTopSchema;
  capacityProductionDesignData: ICapacityProductionSchema;
  systemProductionData: ISystemProductionSchema;
  netUsagePostInstallation: INetUsagePostInstallationSchema;
  costPostInstallation: IUtilityCostData;
  latitude: number;
  longitude: number;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

// @ts-ignore
export const SystemDesignSchema = new Schema<SystemDesign>({
  name: String,
  latitude: Number,
  longitude: Number,
  opportunity_id: String,
  design_mode: String,
  thumbnail: String,
  is_selected: Boolean,
  is_solar: Boolean,
  is_retrofit: Boolean,
  roof_top_design_data: RoofTopSchema,
  capacity_production_design_data: CapacityProductionSchema,
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

  longitude: number;

  opportunityId: string;

  designMode: string;

  thumbnail: string;

  isSelected: boolean;

  isSolar: boolean;

  isRetrofit: boolean;

  roofTopDesignData: IRoofTopSchema;

  capacityProductionDesignData: ICapacityProductionSchema;

  systemProductionData: ISystemProductionSchema;

  netUsagePostInstallation: INetUsagePostInstallationSchema;

  costPostInstallation: IUtilityCostData;

  createdBy: string;

  createdAt: Date;

  updatedBy: string;

  updated_at: Date;

  constructor(systemDesign: CreateSystemDesignDto) {
    this.name = systemDesign.name;
    // this.is_selected = systemDesign.isSelected;
    this.isSolar = systemDesign.isSolar;
    this.isRetrofit = systemDesign.isRetrofit;
    this.latitude = systemDesign.latitude;
    this.longitude = systemDesign.longitude;
    this.opportunityId = systemDesign.opportunityId;
    this.designMode = systemDesign.designMode;
    this.roofTopDesignData =
      systemDesign.roofTopDesignData && this.transformRoofTopData(systemDesign.roofTopDesignData);
    this.capacityProductionDesignData =
      systemDesign.capacityProductionDesignData &&
      this.transformCapacityProductionData(systemDesign.capacityProductionDesignData);
  }

  transformRoofTopData = (data: RoofTopDataReqDto): IRoofTopSchema => {
    const { inverters, storage, panelArray, adders, balanceOfSystems, ancillaryEquipments } = data;
    return {
      panelArray: panelArray || [],
      inverters,
      storage,
      adders,
      balanceOfSystems,
      ancillaryEquipments,
    } as any;
  };

  transformCapacityProductionData = (data: CapacityProductionDataDto): ICapacityProductionSchema => {
    const { panelArray, inverters, storage, adders, balanceOfSystems, ancillaryEquipments } = data;
    return {
      panelArray: panelArray || [],
      inverters,
      storage,
      adders,
      balanceOfSystems,
      ancillaryEquipments,
    } as any;
  };

  setPanelModelDataSnapshot(
    panelModelData: IPanelProductSchema,
    index: number,
    designMode: string = DESIGN_MODE.ROOF_TOP,
  ) {
    if (designMode === DESIGN_MODE.ROOF_TOP) {
      this.roofTopDesignData.panelArray[index].panelModelDataSnapshot = panelModelData;
      this.roofTopDesignData.panelArray[index].panelModelSnapshotDate = new Date();
    } else {
      this.capacityProductionDesignData.panelArray[index].panelModelDataSnapshot = panelModelData;
      this.capacityProductionDesignData.panelArray[index].panelModelSnapshotDate = new Date();
    }
  }

  setAdder(adder: IAdderModel, unit: COST_UNIT_TYPE, index: number, designMode: string = DESIGN_MODE.ROOF_TOP) {
    if (designMode === DESIGN_MODE.ROOF_TOP) {
      this.roofTopDesignData.adders[index].adderModelDataSnapshot = adder;
      this.roofTopDesignData.adders[index].unit = unit;
      this.roofTopDesignData.adders[index].adderModelSnapshotDate = new Date();
    } else {
      this.capacityProductionDesignData.adders[index].adderModelDataSnapshot = adder;
      this.capacityProductionDesignData.adders[index].unit = unit;
      this.capacityProductionDesignData.adders[index].adderModelSnapshotDate = new Date();
    }
  }

  setInverter(inverter: IInverterProductSchema, index: number, designMode: string = DESIGN_MODE.ROOF_TOP) {
    if (designMode === DESIGN_MODE.ROOF_TOP) {
      this.roofTopDesignData.inverters[index].inverterModelDataSnapshot = inverter;
      this.roofTopDesignData.inverters[index].inverterModelSnapshotDate = new Date();
    } else {
      this.capacityProductionDesignData.inverters[index].inverterModelDataSnapshot = inverter;
      this.capacityProductionDesignData.inverters[index].inverterModelSnapshotDate = new Date();
    }
  }

  setStorage(storage: IStorageProductSchema, index: number, designMode: string = DESIGN_MODE.ROOF_TOP) {
    if (designMode === DESIGN_MODE.ROOF_TOP) {
      this.roofTopDesignData.storage[index].storageModelDataSnapshot = storage;
      this.roofTopDesignData.storage[index].storageModelSnapshotDate = new Date();
    } else {
      this.capacityProductionDesignData.storage[index].storageModelDataSnapshot = storage;
      this.capacityProductionDesignData.storage[index].storageModelSnapshotDate = new Date();
    }
  }

  setBalanceOfSystem(
    balanceOfSystems: IBalanceOfSystemProductSchema,
    index: number,
    designMode: string = DESIGN_MODE.ROOF_TOP,
  ) {
    if (designMode === DESIGN_MODE.ROOF_TOP) {
      this.roofTopDesignData.balanceOfSystems[index].balanceOfSystemModelDataSnapshot = balanceOfSystems;
      this.roofTopDesignData.balanceOfSystems[index].balanceOfSystemSnapshotDate = new Date();
    } else {
      this.capacityProductionDesignData.balanceOfSystems[index].balanceOfSystemModelDataSnapshot = balanceOfSystems;
      this.capacityProductionDesignData.balanceOfSystems[index].balanceOfSystemSnapshotDate = new Date();
    }
  }

  setAncillaryEquipment(
    ancillaryEquipment: IAncillaryEquipment,
    index: number,
    designMode: string = DESIGN_MODE.ROOF_TOP,
  ) {
    if (designMode === DESIGN_MODE.ROOF_TOP) {
      this.roofTopDesignData.ancillaryEquipments[index].ancillaryEquipmentModelDataSnapshot = ancillaryEquipment;
      this.roofTopDesignData.ancillaryEquipments[index].ancillaryEquipmentModelDataSnapshotDate = new Date();
    } else {
      this.capacityProductionDesignData.ancillaryEquipments[
        index
      ].ancillaryEquipmentModelDataSnapshot = ancillaryEquipment;
      this.capacityProductionDesignData.ancillaryEquipments[index].ancillaryEquipmentModelDataSnapshotDate = new Date();
    }
  }

  setThumbnail(link: string) {
    this.thumbnail = link;
  }

  // setIsSelected(isSelected: boolean) {
  //   this.is_selected = isSelected;
  // }

  setIsSolar(isSolar: boolean) {
    this.isSelected = isSolar;
  }

  setIsRetrofit(isRetrofit: boolean) {
    this.isSelected = isRetrofit;
  }

  setSystemProductionData(data: ISystemProductionSchema) {
    this.systemProductionData = data;
  }

  setCapacitySystemProduction(data: ISystemProductionSchema, index: number) {
    this.capacityProductionDesignData.panelArray[index].systemProductionData = data;
  }

  setNetUsagePostInstallation(data: INetUsagePostInstallationSchema) {
    this.netUsagePostInstallation = data;
  }

  setCostPostInstallation(data: IUtilityCostData) {
    this.costPostInstallation = data;
  }
}

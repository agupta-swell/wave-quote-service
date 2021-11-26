import { Document, Schema, Types } from 'mongoose';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { IBatteryRating, IProduct, IRating, ISnapshotProduct } from 'src/products-v2/interfaces';
import {
  AdderSnapshotSchema,
  AncillaryEquipmentSnapshotSchema,
  BalanceOfSystemSnapshotSchema,
  BatterySnapshotSchema,
  InverterSnapshotSchema,
  ModuleSnapshotSchema,
  SoftCostSnapshotSchema
} from 'src/products-v2/schemas';
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
    inverterType: String,
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
  pitch: number;
  azimuth: number;
  rowSpacing: number;
  panelModelId: string;
  numberOfPanels: number;
  panelModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.MODULE>;
  panelModelSnapshotDate: Date;
  losses: number;
  useSunroof: boolean;
  sunroofPrimaryOrientationSide?: number;
  sunroofPitch?: number;
  sunroofAzimuth?: number;
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
    pitch: Number,
    azimuth: Number,
    row_spacing: Number,
    panel_model_id: String,
    number_of_panels: Number,
    panel_model_data_snapshot: ModuleSnapshotSchema,
    panel_model_snapshot_date: Date,
    losses: Number,
    sunroof_primary_orientation_side: Number,
    sunroof_pitch: Number,
    sunroof_azimuth: Number,
    use_sunroof: {
      type: Boolean,
      default: false,
    },
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
    panel_model_data_snapshot: ModuleSnapshotSchema,
    panel_model_snapshot_date: Date,
    losses: Number,
    system_production_data: SystemProductionSchema,
  },
  { _id: false },
);

export interface IInverterSchema {
  type: string;
  inverterModelId: string;
  inverterModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.INVERTER>;
  inverterModelSnapshotDate: Date;
  quantity: number;
  arrayId: Types.ObjectId;
}

const InverterSchema = new Schema<Document<IInverterSchema>>(
  {
    type: String,
    inverter_model_id: String,
    inverter_model_data_snapshot: InverterSnapshotSchema,
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
  storageModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.BATTERY>;
  storageModelSnapshotDate: Date;
  reservePercentage: number;
  roundTripEfficiency: number;
  purpose: string;
  batteryType: BATTERY_TYPE;
}

const StorageSchema = new Schema<Document<IStorageSchema>>(
  {
    type: String,
    quantity: Number,
    storage_model_id: String,
    storage_model_data_snapshot: BatterySnapshotSchema,
    storage_model_snapshot_date: Date,
    reserve_percentage: Number,
    round_trip_efficiency: Number,
    purpose: String,
    battery_type: String,
  },
  { _id: false },
);

export interface IAdderSchema {
  adderDescription: string;
  quantity: number;
  unit: COST_UNIT_TYPE;
  adderId: string;
  adderModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.ADDER>;
  adderModelSnapshotDate: Date;
}

const AdderSchema = new Schema<Document<IAdderSchema>>(
  {
    adder_description: String,
    quantity: Number,
    adder_id: String,
    unit: String,
    adder_model_data_snapshot: AdderSnapshotSchema,
    adder_model_snapshot_date: Date,
  },
  { _id: false },
);

export interface IBalanceOfSystemSchema {
  balanceOfSystemId: string;
  balanceOfSystemModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.BALANCE_OF_SYSTEM>;
  balanceOfSystemSnapshotDate: Date;
  unit: COST_UNIT_TYPE;
}

export const BalanceOfSystemSchema = new Schema<Document<IBalanceOfSystemSchema>>(
  {
    balance_of_system_id: String,
    balance_of_system_model_data_snapshot: BalanceOfSystemSnapshotSchema,
    balance_of_system_snapshot_date: Date,
    unit: String,
  },
  { _id: false },
);
export interface IAncillaryEquipmentSchema {
  ancillaryId: string;
  ancillaryEquipmentModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.ANCILLARY_EQUIPMENT>;
  ancillaryEquipmentModelDataSnapshotDate: Date;
  quantity: number;
}

const AncillaryEquipmentSchema = new Schema<Document<IAncillaryEquipmentSchema>>(
  {
    ancillary_id: String,
    ancillary_equipment_model_data_snapshot: AncillaryEquipmentSnapshotSchema,
    ancillary_equipment_model_data_snapshot_date: Date,
    quantity: Number,
  },
  { _id: false },
);

export interface ISofCostSchema {
  softCostId: string;
  softCostModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.SOFT_COST>;
  softCostModelDataSnapshotDate: Date;
  quantity: number;
  description: string;
}

const SoftCostSchema = new Schema<Document<ISofCostSchema>>(
  {
    soft_cost_id: String,
    soft_cost_model_data_snapshot: SoftCostSnapshotSchema,
    soft_cost_model_data_snapshot_date: Date,
    quantity: Number,
    description: String,
  },
  { _id: false },
);

export interface IRoofTopSchema {
  panelArray: ISolarPanelArraySchema[];
  keepouts: ILatLngSchema[][];
  inverters: IInverterSchema[];
  storage: IStorageSchema[];
  adders: IAdderSchema[];
  balanceOfSystems: IBalanceOfSystemSchema[];
  ancillaryEquipments: IAncillaryEquipmentSchema[];
  softCosts: ISofCostSchema[];
}

export interface ICapacityProductionSchema {
  panelArray: ICapacityPanelArraySchema[];
  inverters: IInverterSchema[];
  storage: IStorageSchema[];
  adders: IAdderSchema[];
  balanceOfSystems: IBalanceOfSystemSchema[];
  ancillaryEquipments: IAncillaryEquipmentSchema[];
  softCosts: ISofCostSchema[];
}

export const RoofTopSchema = new Schema<Document<IRoofTopSchema>>(
  {
    panel_array: [SolarPanelArraySchema],
    keepouts: [[LatLngSchema]],
    inverters: [InverterSchema],
    storage: [StorageSchema],
    adders: [AdderSchema],
    balance_of_systems: [BalanceOfSystemSchema],
    ancillary_equipments: [AncillaryEquipmentSchema],
    soft_costs: [SoftCostSchema]
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
    soft_costs: [SoftCostSchema]
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
    const { inverters, storage, panelArray = [], adders, balanceOfSystems, ancillaryEquipments, keepouts, softCosts } = data;
    return {
      panelArray,
      keepouts,
      inverters,
      storage,
      adders,
      balanceOfSystems,
      ancillaryEquipments,
      softCosts,
    } as any;
  };

  transformCapacityProductionData = (data: CapacityProductionDataDto): ICapacityProductionSchema => {
    const { panelArray, inverters, storage, adders, balanceOfSystems, ancillaryEquipments, softCosts } = data;
    return {
      panelArray: panelArray || [],
      inverters,
      storage,
      adders,
      balanceOfSystems,
      ancillaryEquipments,
      softCosts,
    } as any;
  };

  setPanelModelDataSnapshot(
    panelModelData: ISnapshotProduct<PRODUCT_TYPE.MODULE>,
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

  setAdder(
    adder: ISnapshotProduct<PRODUCT_TYPE.ADDER>,
    unit: COST_UNIT_TYPE,
    index: number,
    designMode: string = DESIGN_MODE.ROOF_TOP,
  ) {
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

  setInverter(
    inverter: ISnapshotProduct<PRODUCT_TYPE.INVERTER>,
    index: number,
    designMode: string = DESIGN_MODE.ROOF_TOP,
  ) {
    if (designMode === DESIGN_MODE.ROOF_TOP) {
      this.roofTopDesignData.inverters[index].inverterModelDataSnapshot = inverter;
      this.roofTopDesignData.inverters[index].inverterModelSnapshotDate = new Date();
    } else {
      this.capacityProductionDesignData.inverters[index].inverterModelDataSnapshot = inverter;
      this.capacityProductionDesignData.inverters[index].inverterModelSnapshotDate = new Date();
    }
  }

  setStorage(
    storage: ISnapshotProduct<PRODUCT_TYPE.BATTERY>,
    index: number,
    designMode: string = DESIGN_MODE.ROOF_TOP,
  ) {
    if (designMode === DESIGN_MODE.ROOF_TOP) {
      this.roofTopDesignData.storage[index].storageModelDataSnapshot = storage;
      this.roofTopDesignData.storage[index].storageModelSnapshotDate = new Date();
    } else {
      this.capacityProductionDesignData.storage[index].storageModelDataSnapshot = storage;
      this.capacityProductionDesignData.storage[index].storageModelSnapshotDate = new Date();
    }
  }

  setBalanceOfSystem(
    balanceOfSystems: ISnapshotProduct<PRODUCT_TYPE.BALANCE_OF_SYSTEM>,
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
    ancillaryEquipment: ISnapshotProduct<PRODUCT_TYPE.ANCILLARY_EQUIPMENT>,
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

  setSoftCost(
    softCost: ISnapshotProduct<PRODUCT_TYPE.SOFT_COST>,
    index: number,
    designMode: string = DESIGN_MODE.ROOF_TOP,
  ) {
    if (designMode === DESIGN_MODE.ROOF_TOP) {
      this.roofTopDesignData.softCosts[index].softCostModelDataSnapshot = softCost;
      this.roofTopDesignData.softCosts[index].softCostModelDataSnapshotDate = new Date();
    } else {
      this.capacityProductionDesignData.softCosts[
        index
      ].softCostModelDataSnapshot = softCost;
      this.capacityProductionDesignData.softCosts[index].softCostModelDataSnapshotDate = new Date();
    }
  }

  setThumbnail(link: string) {
    this.thumbnail = link;
  }

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

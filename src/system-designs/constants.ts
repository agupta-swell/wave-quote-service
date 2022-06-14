export enum DESIGN_MODE {
  ROOF_TOP = 'roofTop',
  CAPACITY_PRODUCTION = 'capacityProduction',
}

export enum INVERTER_TYPE {
  MICRO = 'MICRO',
  STRING = 'STRING',
}

export enum INVERTER_TYPE_EXISTING_SOLAR {
  MICRO = 'Micro',
  STRING = 'String',
}

export enum FINANCE_TYPE_EXISTING_SOLAR {
  TPO = 'TPO',
  CASH = 'Cash',
  LOAN = 'Loan',
}

export enum BATTERY_PURPOSE {
  PV_SELF_CONSUMPTION = 'PV_SELF_CONSUMPTION',
  BACKUP_POWER = 'BACKUP_POWER',
  ADVANCED_TOU_SELF_CONSUMPTION = 'ADVANCED_TOU_SELF_CONSUMPTION',
}

export enum ORIENTATION {
  LANDSCAPE = 'Landscape',
  PORTRAIT = 'Portrait',
}

export enum COMPONENT_CATEGORY_TYPE {
  AC = 'AC',
  DC = 'DC',
}

export enum PRODUCT_CATEGORY_TYPE {
  BASE = 'base',
  ANCILLARY = 'ancillary',
  BOS = 'bos',
}

export enum HEATMAP_MODE {
  NO = 'NO',
  ROOFTOP_ANNUAL = 'ROOFTOP_ANNUAL',
  ROOFTOP_MONTHLY = 'MONTHLY',
  FULL_ANNUAL = 'FULL_ANNUAL',
  FULL_MONTHLY = 'FULL_MONTHLY',
  ROOFTOP_MASK = 'ROOFTOP_MASK',
}

export const KEYS = {
  REQ_PARAM_ID: Symbol.for('kReq/system-design/:id'),
};

export enum DESIGN_MODE {
  ROOF_TOP = 'roofTop',
  CAPACITY_PRODUCTION = 'capacityProduction',
}

export enum INVERTER_TYPE {
  MICRO = 'MICRO',
  STRING = 'STRING',
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

export enum COMPONENT_TYPE {
  STORAGE = 'storage',
  SOLAR = 'solar',
  INVERTER = 'inverter',
}

export enum COMPONENT_CATEGORY_TYPE {
  AC = 'AC',
  DC = 'DC',
}

export enum COST_UNIT_TYPE {
  PER_WATT = 'per_watt',
  PER_PROJECT = 'per_project',
  PER_FEET = 'per_feet',
  PER_SQUAREFEET = 'per_squarefeet',
  PER_PANEL = 'per_panel',
  PER_ARRAY = 'per_array',
  PER_INVERTER = 'per_inverter',
  PER_EACH = 'per_each',
}

export enum PRODUCT_CATEGORY_TYPE {
  BASE = 'base',
  ANCILLARY = 'ancillary',
  BOS = 'bos',
}

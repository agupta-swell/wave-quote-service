export enum DESIGN_MODE {
  ROOF_TOP = 'roofTop',
  CAPACITY_PRODUCTION = 'capacityProduction',
}

export enum INVERTER_TYPE {
  MICRO = 'MICRO',
  STRING = 'STRING',
}

export enum STORAGE_TYPE {
  SELF_CONSUMPTION = 'SELF_CONSUMPTION',
  TOU = 'TOU',
  BACKUP_POWER = 'BACKUP_POWER',
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
}

export enum PRODUCT_CATEGORY_TYPE {
  BASE = 'base',
  ANCILLARY = 'ancillary',
  BOS = 'bos',
}

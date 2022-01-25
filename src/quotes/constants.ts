export enum FINANCE_PRODUCT_TYPE {
  LOAN = 'loan',
  LEASE = 'lease',
  CASH = 'cash',
}

export enum INCENTIVE_UNITS {
  PERCENTAGE = 'percentage',
  AMOUNT = 'amount',
}

export enum PROJECT_DISCOUNT_UNITS {
  PERCENTAGE = 'percentage',
  AMOUNT = 'amount',
}

export enum QUOTE_MODE_TYPE {
  PRICE_PER_WATT = 'price_per_watt',
  COST_BUILD_UP = 'cost_build_up',
  PRICE_OVERRIDE = 'price_override',
}

export enum ELaborCostType {
  SOLAR_ONLY_LABOR_FEE_PER_WATT = 'solarOnlyLaborFeePerWatt',
  STORAGE_RETROFIT_LABOR_FEE_PER_PROJECT = 'storageRetrofitLaborFeePerProject',
  SOLAR_WITH_AC_STORAGE_LABOR_FEE_PER_PROJECT = 'solarWithACStorageLaborFeePerProject',
  SOLAR_WITH_DC_STORAGE_LABOR_FEE_PER_PROJECT = 'solarWithDCStorageLaborFeePerProject',
}

export enum INCENTIVE_APPLIES_TO_VALUE {
  SOLAR = 'solar',
  STORAGE = 'storage',
  SOLAR_AND_STORAGE = 'solar_and_storage',
}

export enum REBATE_TYPE {
  PROGRAM_REBATE = 'PROGRAM_REBATE',
  ITC = 'ITC',
  SGIP = 'SGIP',
  ERT = 'ERT',
  ER = 'ER',
}

export enum PRIMARY_QUOTE_TYPE {
  BATTERY_ONLY = 'Battery Only',
  BATTERY_WITH_EXISTING_SOLAR = 'Battery with Existing Solar',
  BATTERY_WITH_NEW_SOLAR = 'Battery with New Solar',
  SOLAR_ONLY = 'Solar Only',
}

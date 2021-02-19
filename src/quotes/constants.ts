export enum FINANCE_PRODUCT_TYPE {
  LOAN = 'loan',
  LEASE = 'lease',
  CASH = 'cash',
}

export enum INCENTIVE_APPLIES_TO_VALUE {
  SOLAR = 'solar',
  STORAGE = 'storage',
  SOLAR_AND_STORAGE = 'solar_and_storage',
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

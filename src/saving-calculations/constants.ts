export enum CALCULATION_TYPE {
  PRIMARY = 'primary',
  ADDITIONAL = 'additional',
}

export enum SCENARIO_TYPE {
  BAU = 'bau',
  PV = 'pv',
  STORAGE = 'storage',
}

export enum RATE_NAME_TYPE {
  DOMESTIC = 'domestic',
  DOMESTIC_CARE = 'domestic_care',
  DOMESTIC_ELECTRIC_HEAT = 'domestic_electric_heat',
  DOMESTIC_TIME_OF_USE_PRIME = 'domestic_time_of_use_prime',
  FAMILY_ELECTRIC_RATE_ASSITANCE_FERA = 'family_electric_rate_assitance_fera',
  DOMESTIC_TIME_OF_USE_4_TO_9_PM = 'domestic_time_of_use_4_to_9_pm',
  DOMESTIC_TIME_OF_USE_5_TO_8_PM = 'domestic_time_of_use_5_to_8_pm',
}

export enum SERVICE_RESPONSE_STATUS_TYPE {
  SUCCESS = 'success',
  FAILURE = 'failure',
  ERROR = 'error',
}

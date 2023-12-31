export enum ENERGY_SERVICE_TYPE {
  SWELL_ESA_SOLAR_ONLY = 'swell_esa_solar_only',
  SWELL_ESA_ESSENTIAL_BACKUP = 'swell_esa_essential_backup',
  SWELL_ESA_WHOLE_HOME = 'swell_esa_whole_home',
  SWELL_ESA_COMPLETE_BACKUP = 'swell_esa_complete_backup',
}

export enum PAYMENT_TYPE {
  UNKNOWN_PLEASE_AUDIT = ' unknown_please_audit',
  LOAN = 'loan',
  CASH = 'cash',
  LEASE_SOLAR_ONLY = 'lease_solar_only',
  LEASE_ESSENTIAL_BACKUP = 'lease_essential_backup',
  LEASE_WHOLE_HOME_BACKUP = 'lease_whole_home_backup',
  LEASE_COMPLETE_BACKUP = 'lease_complete_backup',
}

export enum ECOM_PRODUCT_TYPE {
  PANEL = 'panel',
  INVERTER = 'inverter',
  BATTERY = 'battery',
  LABOR = 'labor',
}

export const DEFAULT_ENVIRONMENTAL_LOSSES_DATA = {
  regionDescription: '',
  amounts: Array(12).fill(0),
};

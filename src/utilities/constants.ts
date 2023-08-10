export enum INTERVAL_VALUE {
  DAY = 'day',
  MONTH = 'month',
  YEAR = 'year',
}

export enum CALCULATION_MODE {
  TYPICAL = 'typical',
  ACTUAL = 'actual',
}

export enum ENTRY_MODE {
  BASELINE = 'BASELINE',
  CSV_INTERVAL_DATA = 'CSV_INTERVAL_DATA',
  ANNUAL_COST = 'ANNUAL_COST',
  ANNUAL_USAGE = 'ANNUAL_USAGE',
  MONTHLY_COST = 'MONTHLY_COST',
  MONTHLY_USAGE = 'MONTHLY_USAGE',
}

export enum PROPOSAL_VIEW_MODE {
  TYPICAL = 'TYPICAL',
  AVERAGE = 'AVERAGE',
}

export enum PROPOSAL_PERIOD_MODE {
  ANNUAL = 'ANNUAL',
  MONTHLY = 'MONTHLY',
}

export const TYPICAL_USAGE_METAKEY = Symbol.for('kUtility/typicalUsage');

export const KWH_PER_GALLON = 33.7;

export enum CHARGING_LOGIC_TYPE {
  NEM3 = 'NEM3',
  NEM2 = 'NEM2',
}

export enum HOURLY_USAGE_PROFILE {
  COMPUTED_ADDITIONS = 'hourlyComputedAdditions',
  HOME_USAGE_PROFILE = 'hourlyHomeUsageProfile',
  ADJUSTED_USAGE_PROFILE = 'hourlyAdjustedUsageProfile',
  CURRENT_USAGE_PROFILE = 'hourlyCurrentUsageProfile',
  PLANNED_PROFILE = 'hourlyPlannedProfile',
}

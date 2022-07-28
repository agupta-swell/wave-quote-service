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

export const TYPICAL_USAGE_METAKEY = Symbol.for('kUtility/typicalUsage');

export const KWH_PER_GALLON = 33.7;

export enum OPERATION_MODE {
  BACKUP_POWER = 'Backup Power',
  PV_SELF_CONSUMPTION = 'PV Self Consumption',
  ADVANCE_TOU = 'Advanced TOU',
}

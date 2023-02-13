export const PRODUCTION_DERATES_NAME = {
  WIRING_LOSSES: 'Wiring',
  CONNECTION_LOSSES: 'Connection',
  ALL_OTHER_LOSSES: 'All other losses',
};

export const PRODUCTION_DERATES_NAME_MAPPER = {
  [PRODUCTION_DERATES_NAME.WIRING_LOSSES]: 'wiringLosses',
  [PRODUCTION_DERATES_NAME.CONNECTION_LOSSES]: 'connectionLosses',
  [PRODUCTION_DERATES_NAME.ALL_OTHER_LOSSES]: 'allOtherLosses',
};

export const PRODUCTION_DERATES_COLLECTION_NAME = 'v2_production_derates';

export const DEFAULT_PRODUCTION_DERATES = {
  wiringLosses: 0,
  connectionLosses: 0,
  allOtherLosses: 0,
};

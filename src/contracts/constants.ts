import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { QUOTE_MODE_TYPE } from 'src/quotes/constants';

export enum CONTRACT_TYPE {
  PRIMARY_CONTRACT = 'PRIMARY_CONTRACT',
  GRID_SERVICES_PACKET = 'GRID_SERVICES_PACKET',
  CHANGE_ORDER = 'CHANGE_ORDER',
  NO_COST_CHANGE_ORDER = 'NO_COST_CHANGE_ORDER',
}

export enum SIGN_STATUS {
  SENT = 'SENT',
  SIGNED = 'SIGNED',
  WET_SIGNED = 'WET_SIGNED',
}

export enum PROCESS_STATUS {
  INITIATED = 'INITIATED',
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  DRAFT = 'DRAFT',
  VOIDED = 'VOIDED',
}

export enum STATUS {
  NEW = 'New',
  AGREEMENT_GENERATED = 'Agreement Generated',
  SENT_TO_PRIMARY_OWNER = 'Sent to Primary Owner',
  SENT_TO_FINANCIER = 'Sent to Financier',
  SIGNED = 'Signed',
}

export enum REQUEST_MODE {
  ADD = 'ADD',
  UPDATE = 'UPDATE',
}

export enum CONTRACT_ROLE {
  PRIMARY_OWNER = 'Primary Owner',
  CO_OWNER = 'Co Owner',
  FINANCIER = 'Financier',
}

export const KEYS = {
  CONTRACT_TYPE: Symbol.for('contractType'),
  CONTRACT_ID_PATH: Symbol.for('contractIdProp'),
};

export const CONTRACT_SECRET_PREFIX = 'contract';

export const DEFAULT_PROJECT_COMPLETION_DATE_OFFSET = 90;

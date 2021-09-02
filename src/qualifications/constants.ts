export enum PROCESS_STATUS {
  INITIATED = 'INITIATED',
  STARTED = 'STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR',
}

export enum VENDOR_ID {
  FNI = 'FNI',
}

export enum APPROVAL_MODE {
  AGENT = 'AGENT',
  CREDIT_VENDOR = 'CREDIT_VENDOR',
}

export enum QUALIFICATION_STATUS {
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  PENDING = 'PENDING',
}

export enum REQUEST_CATEGORY {
  CREDIT = 'CREDIT',
  TITLE = 'TITLE',
}

export enum REQUEST_TYPE {
  OUTBOUND = 'OUTBOUND',
  INBOUND = 'INBOUND',
}

export enum ROLE {
  AGENT,
  CUSTOMER,
  SYSTEM,
}

export enum TOKEN_STATUS {
  EXPIRED,
  INVALID,
  VALID,
}

export enum QUALIFICATION_TYPE {
  SOFT = 'SOFT',
  HARD = 'HARD',
}

export enum PROCESS_STATUS {
  INITIATED = 'INITIATED',
  STARTED = 'STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  APPLICATION_EMAILED = 'APPLICATION EMAILED',
  VERBAL_CONSENT_ACCEPTED = 'VERBAL CONSENT - ACCEPTED',
  VERBAL_CONSENT_DECLINED = 'VERBAL CONSENT - DECLINED',
  COMPLETE_APPLICANT_DECLINED_VERBAL_CONSENT = 'COMPLETE - APPLICANT DECLINED VERBAL CONSENT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR',
}

export enum MILESTONE_STATUS {
  INITIATED = 'Initiated',
  VERBAL_CONSENT = 'Verbal Consent',
  APPLICATION_EMAILED = 'Application Emailed',
  APPLICATION_STATUS = 'Application Status',
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
  REVIEW = 'REVIEW',
  WITHDRAWN = 'WITHDRAWN',
  ERROR = 'ERROR',
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
  TITLE_VERIFICATION = 'TITLE_VERIFICATION',
  DOCUMENT_LIBRARY = 'QUAL_DOCUMENT_LIBRARY',
}

export enum QUALIFICATION_CATEGORY {
  SOFT_CREDIT = 'Soft Credit',
  HARD_CREDIT = 'Hard Credit',
  TITLE_VERIFICATION = 'Title Verification',
  DOCUMENT_LIBRARY = 'Qualification Document Library',
}

export enum CONSENT_STATUS {
  HAS_APPLICANT_CONSENT = 'HAS_APPLICANT_CONSENT',
  HAS_CO_APPLICANT = 'HAS_CO_APPLICANT',
  HAS_CO_APPLICANT_CONSENT = 'HAS_CO_APPLICANT_CONSENT',
}

export enum FNI_APPLICATION_STATE {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum APPLICANT_TYPE {
  APPLICANT = 'applicant',
  CO_APPLICANT = 'coapplicant',
}

export enum FNI_REQUEST_TYPE {
  SOLAR_INIT = 'solar_init',
  SOLAR_INITCOAPP = 'solar_initcoapp',
  SOLAR_APPLY = 'solar_apply',
  SOLAR_APPLY_INCOMING = 'solar_apply_incoming',
}

export enum FNI_TRANSACTION_STATUS {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export const FNI_RESPONSE_ERROR_MAP: Record<number, string> = {
  400: 'Invalid Input Data',
  401: 'Unauthorized Access',
  500: 'Invalid Server Error',
};

export enum APPLICATION_PROCESS_STATUS {
  APPLICATION_PROCESS_SUCCESS = 'APPLICATION_PROCESS_SUCCESS',
  APPLICATION_PROCESS_ERROR = 'APPLICATION_PROCESS_ERROR',
}

export enum EVENT_HISTORY_DETAIL {
  REQUEST_INITIATED = 'Request Initiated',
  REQUEST_RE_INITIATED = 'Request Re-Initiated',
  CREDIT_CHECK_APPROVAL_BY_AGENT = 'Credit Check Approved By Agent',
  COAPPLICANT_CONSENT_SET_TO_YES = 'Co-Applicant Consent set to Yes',
  COAPPLICANT_CONSENT_SET_TO_NO = 'Co-Applicant Consent set to No',
  HAS_COAPPLICANT_SET_TO_YES = 'Has Co-Applicant set to Yes',
  HAS_COAPPLICANT_SET_TO_NO = 'Has Co-Applicant set to No',
  APPLICANT_CONSENT_SET_TO_YES = 'Applicant consent set to Yes',
  APPLICANT_CONSENT_SET_TO_NO = 'Applicant consent set to No',
  EMAIL_SENT = 'Email Sent',
  UNABLE_TO_SEND_EMAIL_TO_CO_APPLICANT = 'Unable to send email to Co Applicant',
  UNABLE_TO_SEND_EMAIL = 'Unable to Send Email',
  UNABLE_TO_SHOW_APPLICATION = 'Unable to Show Application',
  APPLICATION_SENT_FOR_CREDIT_CHECK = 'Application sent for Credit Check',
  UNABLE_TO_PROCESS_APPLICATION= 'Unable to Process Application',
  CREDIT_VALIDATION_IN_PROGRESS = 'Credit Validation In Progress',
  CREDIT_VALIDATION_COMPLETED = 'Credit Validation Completed',
  CREDIT_VALIDATION_ERROR = 'Credit Validation Error',
}

interface IApplicantData {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipcode: number;
}

interface IPersonalInformation {
  soc: number;
  dob: Date;
}

export interface IFniApplyReq {
  qualificationCreditId: string;
  opportunityId: string;
  primaryApplicantData: IApplicantData;
  coApplicantData: IApplicantData;
  primaryApplicantSecuredData: IPersonalInformation;
  coApplicantSecuredData: IPersonalInformation;
}

export interface IFniUpdateReq {
  vendorRefId: string;
  fniCommunicationId: string;
  code: string;
  qualificationCreditId: string;
  rawRequest: string;
}

export interface IFniUpdateRes {
  refnum: string;
  status: string;
  errorMsgs: {
    errorType: string;
    fieldId: string;
    message: string;
  }[];
}

// ======================= SWAGGER =======================
// https://sites.google.com/swellenergy.com/wave2/enhanced-quoting-process/creditcheck

export interface IApplyRequest {
  transaction: {
    username: string;
    password: string;
    partnerId: string;
  };
  application: {
    track: string;
    waveId: string;
  };
  applicant1: {
    first: string;
    mi?: string;
    sightenId: string;
    last: string;
    email: string;
    phoneNumber: string;
    primSmsFlag?: string;
    dob: string;
    soc: string;
    primAddr: string;
    primAttn?: string;
    primCity: string;
    primState: string;
    primZip: string;
  };
  applicant2: {
    first: string;
    mi?: string;
    sightenId: string;
    last: string;
    email: string;
    phoneNumber: string;
    primSmsFlag?: string;
    dob: string;
    soc: string;
    coAddr: string;
    coAttn?: string;
    coCity: string;
    coState: string;
    coZip: string;
  };
}

export interface IApplyResponse {
  transaction: {
    refNum: string;
    status: string;
    errorMsgs?: {
      errorType: string;
      fieldId: string;
      message: string;
    }[];
  };
  application: {
    code: string;
    track: string;
  };
  applicant1: {
    sightenId: string;
  };
}

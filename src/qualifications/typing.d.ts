import { HttpStatus } from '@nestjs/common';
import { FNI_REQUEST_TYPE } from './constants';

interface IApplicantData {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface IResidenceData {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipcode: string;
}

interface IPersonalInformation {
  soc: number;
  dob: Date;
  individualIncome: string;
  incomeFrequency: string;
}

export interface IFniProcessReq {
  transaction: {
    key: string;
    hash: string;
    partnerId: string;
    refnum: string;
  };
}

export interface IFniApplyReq {
  opportunityId: string;
  productId: string;
  applicant: IApplicantData;
  applicantSecuredData: IPersonalInformation;
  primaryResidence: IResidenceData;
  installationAddress: IResidenceData;
  refnum?: number;
}

export interface IFniSolarInitReqPayload {
  transaction: {
    key: string;
    hash: string;
    partnerId: string;
  };
  application: {
    externalTrackingNum: string;
    productId: string;
    requestCrline: string;
  };
  applicant1: {
    first: string;
    mi?: string;
    last: string;
    soc: string;
    dob: string;
    addr: string;
    attn: string;
    city: string;
    state: string;
    zip: string;
    eMail: string;
    phone: string;
    propAddr: string;
    propAttn: string;
    propCity: string;
    propState: string;
    propZip: string;
  };
  employment: {
    empChnum: string;
    empPay: string;
    empPayBasis: string;
    empType: string;
  }[];
}

export interface IFniSolarInitCoAppReqPayload {
  transaction: {
    key: string;
    hash: string;
    partnerId: string;
    refnum: string;
  };
  applicant2: {
    first: string;
    mi?: string;
    last: string;
    soc: string;
    dob: string;
    addr: string;
    city: string;
    state: string;
    zip: string;
    eMail: string;
    phone: string;
    propAddr: string;
    propCity: string;
    propState: string;
    propZip: string;
  };
  employment: {
    empChnum: string;
    empPay: string;
    empPayBasis: string;
    empType: string;
  }[];
}

export interface IFniResponseData {
  transaction: {
    refnum: string;
    status: string;
    errorMsgs?: {
      errorType: string;
      fieldId: string;
      message: string;
    }[];
  };
  application?: Record<string, string>;
  field_descriptions?: Record<string, string>;
  stips?: {
    description: string;
    id: string;
    status: string;
  }[];
}

export interface IFniResponse {
  type: FNI_REQUEST_TYPE;
  status: number;
  data?: IFniResponseData;
}

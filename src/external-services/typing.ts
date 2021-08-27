import { EnvelopeSummary, LoginAccount } from 'docusign-esign';

export interface ICalculateSystemProduction {
  lat: number;
  lon: number;
  systemCapacity: number;
  azimuth: number;
  tilt?: number;
  losses?: number;
}

export interface ILoadServingEntity {
  lseName: string;
  lseCode: string;
  zipCode: number;
  serviceType: string;
  lseId: string;
}

export interface ITypicalUsage {
  i: number;
  v: number;
}

export interface ITypicalBaseLine {
  zipCode: number;
  buildingType: string;
  customerClass: string;
  lseName: string;
  lseId: number;
  sourceType: string;
  annualConsumption: number;
  typicalHourlyUsage: ITypicalUsage[];
  typicalMonthlyUsage: ITypicalUsage[];
}

export interface IPvWattV6Responses {
  poa_monthly: number[];
  dc_monthly: number[];
  ac_monthly: number[];
  ac_annual: number;
  solrad_monthly: number[];
  solrad_annual: number;
  capacity_factor: number;
  ac: number[];
  poa: number[];
  dn: number[];
  dc: number[];
  df: number[];
  tamb: number[];
  tcell: number[];
  wspd: number[];
}

export interface ILoginAccountWithMeta extends LoginAccount {
  headers: Record<string, string>;
}

export interface IResendEnvelopeSuccess {
  status: true;
}

export interface IResendEnvelopeFail {
  status: false;
  message: string;
}

export type TResendEnvelopeStatus = IResendEnvelopeFail | IResendEnvelopeSuccess;

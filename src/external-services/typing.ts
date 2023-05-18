export interface ICalculateSystemProduction {
  lat: number;
  lon: number;
  systemCapacity: number;
  azimuth: number;
  tilt?: number;
  losses?: number;
}

export interface ILoadServingEntityResponse {
  name: string;
  lseCode: string;
  serviceTypes: string;
  lseId: string;
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

export interface ITypicalBaseLineResponse {
  buildingType: { id: string; customerClass: string };
  climateZone: { lseName: string; lseId: number };
  serviceType: string;
  factors: { annualConsumption: number };
  measures: ITypicalUsage[];
}

export interface ITypicalBaseLineBase {
  buildingType: string;
  customerClass: string;
  lseName: string;
  lseId: number;
  sourceType: string;
  annualConsumption: number;
}

export interface ITypicalBaseLineData extends ITypicalBaseLineBase {
  measures: ITypicalUsage[];
}

export interface ITypicalBaseLine extends ITypicalBaseLineBase {
  zipCode: number;
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

export enum EGenabilityGroupBy {
  ALL = 'ALL', //	One group for the entire calculation period.
  YEAR = 'YEAR', //	Groups the calculation details by year.
  MONTH = 'MONTH', //	Groups the calculation details by month. When billingPeriod=true, groups by the billing period instead of the month.
  DAY = 'DAY', //	Groups the calculation details by day.
  HOUR = 'HOUR', //	Groups the calculation details by hour.
  QTRHOUR = 'QTRHOUR', //	Groups the calculation details by 15 minute intervals.
}

export enum EGenabilityDetailLevel {
  TOTAL = 'TOTAL', //	Return only the overall total, without any item breakdown.
  CHARGE_TYPE = 'CHARGE_TYPE', //	Group the rates by charge type, such as FIXED, CONSUMPTION, QUANTITY.
  CHARGE_TYPE_AND_TOU = 'CHARGE_TYPE_AND_TOU', //	Group the rates by charge type, quantity type, season, tariff version, time of use, and tiers.
  RATE = 'RATE', //	Group the items by rates.
  ALL = 'ALL', //	Group the calculation results by distinct calculation interval (full details).
}

export interface IGenabilityCalculateUtilityCost {
  hourlyDataForTheYear: number[];
  masterTariffId: string;
  groupBy?: EGenabilityGroupBy;
  detailLevel?: EGenabilityDetailLevel;
  billingPeriod?: boolean;
  zipCode: string;
  startDate?: Date;
  medicalBaselineAmount?: number;
}

export interface ICalculateCostAddress {
  country: string;
  zip: string;
}

export interface ICalculateCostPropertyInputs {
  keyName: string;
  fromDateTime?: string;
  duration?: number;
  unit?: string;
  dataSeries?: number[];
  exportDataSeries?: number[];
  dataValue?: string; 
}

export interface ICalculateCostPayload {
  address: ICalculateCostAddress;
  fromDateTime: string;
  toDateTime: string;
  masterTariffId: string;
  groupBy: EGenabilityGroupBy;
  detailLevel: EGenabilityDetailLevel;
  billingPeriod: boolean;
  minimums: boolean;
  propertyInputs: ICalculateCostPropertyInputs[];
}

export interface ITariffParams {
  zipCode: number;
  populateProperties: boolean;
  isActive: boolean;
  customerClasses: string;
  pageCount: number;
  pageStart?: number;
}

export interface IAxiosDataResponse {
  count: number;
  results: any;
}

export interface INetNegativeAnnualUsage {
  annualPostInstallBill: number;
  fromDateTime: string;
  toDateTime: string;
}

export interface ICalculateNetNegativeAnnualUsage {
  postInstall8760: number[],
  masterTariffId: string,
  zipCode: number,
  medicalBaselineAmount?: number,
  startDate?: Date,
}

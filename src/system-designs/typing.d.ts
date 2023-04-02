
export interface IMountTypeDerating {
  name: string;
  derateNumber: number;
  percent: number;
}

export interface IInverterRatingClippingSystem {
  value: number;
  percent: number
}

export interface IProductionDeratesData{
  value?: string | number;
  subValue?: number | number[];
  array?: number[] | IMountTypeDerating[];
  system?: number | IInverterRatingClippingSystem;
  netProduction?: number;
}

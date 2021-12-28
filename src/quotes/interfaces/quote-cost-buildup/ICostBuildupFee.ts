export interface IBaseCostBuildupFee {
  unitPercentage: number;
  total: number;
}

export interface ICashDiscount extends IBaseCostBuildupFee {
  name: string;
}

export interface IAdditionalFees {
  total: number;
}

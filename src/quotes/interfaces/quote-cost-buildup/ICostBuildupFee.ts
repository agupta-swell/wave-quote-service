import { IMarginImpact } from '.';
import { ICogsImpact } from './ICogsImpact';

export interface IBaseCostBuildupFee extends ICogsImpact, IMarginImpact {
  unitPercentage: number;
  total: number;
}

export interface ICashDiscount extends IBaseCostBuildupFee {
  name: string;
}

export interface IAdditionalFees {
  total: number;
}

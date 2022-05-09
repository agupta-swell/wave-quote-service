import { IMarginImpact } from '.';
import { ICogsImpact } from './ICogsImpact';

export enum SALES_ORIGINATION_SALES_FEE_INPUT_TYPE {
  PERCENTAGE = 'PERCENTAGE',
  TOTAL = 'TOTAL',
}

export interface IBaseCostBuildupFee extends ICogsImpact, IMarginImpact {
  unitPercentage: number;
  total: number;
}

export interface ISalesOriginationSalesFee extends IBaseCostBuildupFee {
  inputType?: SALES_ORIGINATION_SALES_FEE_INPUT_TYPE;
}

export interface ICashDiscount extends IBaseCostBuildupFee {
  name: string;
}

export interface IAdditionalFees {
  total: number;
  cogsAmount: number;
  marginAmount: number;
}

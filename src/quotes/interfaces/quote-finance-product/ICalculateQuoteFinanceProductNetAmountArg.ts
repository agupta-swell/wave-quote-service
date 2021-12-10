import { DISCOUNT_TYPE } from 'src/discounts/discount.constant';
import { PROMOTION_TYPE } from 'src/promotions/promotion.constant';
import { REBATE_TYPE } from 'src/quotes/constants';

export interface IReductionAmount<T> {
  amount: number;
  type: T;
}

export interface ICalculateQuoteFinanceProductNetAmountArg {
  rebateDetails: IReductionAmount<REBATE_TYPE>[];
  incentiveDetails: IReductionAmount<string>[];
  projectDiscountDetails: IReductionAmount<DISCOUNT_TYPE>[];
  promotionDetails: IReductionAmount<PROMOTION_TYPE>[];
}

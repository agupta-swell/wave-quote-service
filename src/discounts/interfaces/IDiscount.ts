import { Document } from 'mongoose';
import { ICogsImpact, IMarginImpact } from 'src/quotes/interfaces';
import { DISCOUNT_TYPE } from '../discount.constant';

export interface IDiscount extends ICogsImpact, IMarginImpact {
  amount: number;
  endDate: Date;
  name: string;
  startDate: Date;
  type: DISCOUNT_TYPE;
}

export type IDiscountDocument = Document & IDiscount;

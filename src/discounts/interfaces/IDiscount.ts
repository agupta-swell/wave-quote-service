import { Document } from 'mongoose';
import { DISCOUNT_TYPE } from '../discount.constant';

export interface IDiscount {
  amount: number;
  endDate: Date;
  name: string;
  startDate: Date;
  type: DISCOUNT_TYPE;
}

export type IDiscountDocument = Document & IDiscount;

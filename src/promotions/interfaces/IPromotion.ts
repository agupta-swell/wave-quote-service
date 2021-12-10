import { Document } from 'mongoose';
import { PROMOTION_TYPE } from '../promotion.constant';

export interface IPromotion {
  amount: number;
  endDate: Date;
  name: string;
  startDate: Date;
  type: PROMOTION_TYPE;
}

export type IPromotionDocument = Document & IPromotion;

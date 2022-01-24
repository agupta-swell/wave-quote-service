import { Document } from 'mongoose';
import { ICogsImpact, IMarginImpact } from 'src/quotes/interfaces';
import { PROMOTION_TYPE } from '../promotion.constant';

export interface IPromotion extends ICogsImpact, IMarginImpact {
  amount: number;
  endDate: Date;
  name: string;
  startDate: Date;
  type: PROMOTION_TYPE;
}

export type IPromotionDocument = Document & IPromotion;

import { Document } from 'mongoose';
import { PRIMARY_QUOTE_TYPE } from 'src/quotes/constants'

export interface ITaxCreditConfig {
  name: string;
  isFederal: boolean;
  stateCode?: string;
  percentage: number;
  applicableQuoteTypes: PRIMARY_QUOTE_TYPE;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export type ITaxCreditConfigDocument = Document & ITaxCreditConfig;

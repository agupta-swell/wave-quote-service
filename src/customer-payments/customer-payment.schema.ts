import { Document, Schema } from 'mongoose';

export const CUSTOMER_PAYMENT = Symbol('CUSTOMER_PAYMENT').toString();

export interface CustomerPayment extends Document {
  opportunityId: string;
  netAmount: number;
  amount: number;
  credit: number;
  deposit: number;
  payment1: number;
  payment2: number;
  programIncentiveDiscount: number;
  rebate: number;
  rebateGuaranteed: number;
}

export const CustomerPaymentSchema = new Schema<CustomerPayment>({
  _id: Schema.Types.Mixed,
  opportunityId: String,
  netAmount: Number,
  amount: Number,
  credit: Number,
  deposit: Number,
  payment1: Number,
  payment2: Number,
  programIncentiveDiscount: Number,
  rebate: Number,
  rebateGuaranteed: Number,
});

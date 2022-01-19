import { randomBytes } from 'crypto';
import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';

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
  wqtContractId?: string;
  adjustment: number;
}

export const CustomerPaymentSchema = new Schema<CustomerPayment>(
  {
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
    wqtContractId: String,
    adjustment: Number,
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'modifiedAt' },
  },
);

CustomerPaymentSchema.pre('save', function (next) {
  if (!this._id) {
    this._id = randomBytes(8).toString('hex');
  }

  next();
});

MongooseNamingStrategy.ExcludeOne(CustomerPaymentSchema);

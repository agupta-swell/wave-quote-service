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
  actualDepositMade: number;
  actualPayment1Made: number;
  payment1Date: Date;
  actualPayment1Date: Date;
  actualPayment1Status: string;
  actualPayment1PaidByDwolla: boolean;
  payment2Date: Date;
  actualPayment2Made: number;
  actualPayment2Date: Date;
  actualPayment2Status: string;
  actualPayment2PaidByDwolla: boolean;
  sightenQuoteStage: string;
  sightenQuoteId: string;
  projectId: string;
  refundAmount: number;
  paidByCheck: boolean;
  achPayment: boolean;
  netOutRebate: boolean;
  paymentNotes: string;
  chargeStripeFee: boolean;
  createdAt: Date;
  updatedAt: Date;
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
    actualDepositMade: Number,
    sightenQuoteStage: {
      type: String,
      optional: true,
    },
    sightenQuoteId: {
      type: String,
      optional: true,
    },
    projectId: {
      type: String,
      optional: true,
    },

    payment1Date: {
      type: Date,
      optional: true,
    },
    payment2Date: {
      type: Date,
      optional: true,
    },
    actualPayment1Date: {
      type: Date,
      optional: true,
    },
    actualPayment1Made: {
      type: Number,
      decimal: true,
      optional: true,
    },
    actualPayment2Date: {
      type: Date,
      optional: true,
    },
    actualPayment2Made: {
      type: Number,
      decimal: true,
      optional: true,
    },
    refundAmount: {
      type: Number,
      decimal: true,
      optional: true,
    },
    paidByCheck: {
      type: Boolean,
      defaultValue: false,
      optional: true,
    },
    achPayment: {
      type: Boolean,
      defaultValue: false,
      optional: true,
    },
    netOutRebate: {
      type: Boolean,
      defaultValue: false,
      optional: true,
    },
    paymentNotes: {
      type: String,
      optional: true,
    },
    actualDepositStatus: {
      type: String,
      optional: true,
    },
    actualPayment1Status: {
      type: String,
      optional: true,
    },
    // check if payment 1 was made by Dwolla
    actualPayment1PaidByDwolla: {
      type: Boolean,
      optional: true,
    },
    actualPayment2Status: {
      type: String,
      optional: true,
    },
    // check if payment 2 was made by Dwolla
    actualPayment2PaidByDwolla: {
      type: Boolean,
      optional: true,
    },

    // Toggle variable follow by https://trello.com/c/qcUinhs7/398-toggle-for-stripe-fee
    chargeStripeFee: {
      type: Boolean,
      defaultValue: true,
      optional: true,
    },
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

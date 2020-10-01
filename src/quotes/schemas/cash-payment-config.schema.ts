import { Schema } from 'mongoose';

export const CASH_PAYMENT_CONFIG = Symbol('CASH_PAYMENT_CONFIG').toString();

export interface IConfig {
  name: string;
  percentage: number;
}

const Config = new Schema<IConfig>({
  name: String,
  percentage: Number,
});

export interface CashPaymentConfig extends Document {
  type: string;
  config: IConfig[];
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const CashPaymentConfigSchema = new Schema<CashPaymentConfig>({
  type: String,
  config: [Config],
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});

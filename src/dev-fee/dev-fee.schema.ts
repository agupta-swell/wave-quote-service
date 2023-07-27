import { Schema, Document } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';

export interface DevFee extends Document {
  devFeeName: string;
  fundId: string;
  sightenProductId: string;
  devFee: number;
  upfrontFee: number;
}

export const DevFeeSchema = new Schema<DevFee>(
  {
    devFeeName: String,
    fundId: String,
    sightenProductId: String,
    devFee: {
      type: Number,
      decimal: true,
      optional: true,
      max: 100,
    },
    upfrontFee: {
      type: Number,
      decimal: true,
      optional: true,
      max: 100,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    versionKey: false,
  },
);

MongooseNamingStrategy.ExcludeOne(DevFeeSchema);

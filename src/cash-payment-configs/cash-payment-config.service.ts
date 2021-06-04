import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { CashPaymentConfig, CASH_PAYMENT_CONFIG } from './cash-payment-config.schema';

@Injectable()
export class CashPaymentConfigService {
  constructor(@InjectModel(CASH_PAYMENT_CONFIG) private cashPaymentConfig: Model<CashPaymentConfig>) {}

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getFirst(): Promise<LeanDocument<CashPaymentConfig> | null> {
    const [product] = await this.cashPaymentConfig.find().lean();

    return product;
  }
}

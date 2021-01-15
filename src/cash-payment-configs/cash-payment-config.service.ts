import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CashPaymentConfig, CASH_PAYMENT_CONFIG } from './cash-payment-config.schema';

@Injectable()
export class CashPaymentConfigService {
  constructor(@InjectModel(CASH_PAYMENT_CONFIG) private cashPaymentConfig: Model<CashPaymentConfig>) {}

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getFirst(): Promise<CashPaymentConfig | undefined> {
    const [product] = await this.cashPaymentConfig.find();
    return product;
  }
}

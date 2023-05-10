import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { EsaPaymentConfig, ESA_PAYMENT_CONFIG } from './esa-payment-config.schema';

@Injectable()
export class EsaPaymentConfigService {
  constructor(@InjectModel(ESA_PAYMENT_CONFIG) private esaPaymentConfig: Model<EsaPaymentConfig>) {}

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getFirst(): Promise<LeanDocument<EsaPaymentConfig> | null> {
    const [product] = await this.esaPaymentConfig.find().lean();

    return product;
  }
}

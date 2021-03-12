import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from '../app/common';
import { QuotePartnerConfig, QUOTE_PARTNER_CONFIG } from './quote-partner-config.schema';
import { QuotePartnerConfigDto } from './res/quote-partner-config.dto';

@Injectable()
export class QuotePartnerConfigService {
  constructor(@InjectModel(QUOTE_PARTNER_CONFIG) private readonly quotePartnerConfigModel: Model<QuotePartnerConfig>) {}

  async getConfigByPartnerId(partnerId: string): Promise<OperationResult<QuotePartnerConfigDto>> {
    const foundConfig = await this.quotePartnerConfigModel.findOne({ partnerId });
    if (!foundConfig) {
      throw ApplicationException.EnitityNotFound(partnerId);
    }

    return OperationResult.ok(new QuotePartnerConfigDto(foundConfig));
  }

  // ========================== INTERNAL ==========================

  async getDetailByPartnerId(partnerId: string): Promise<LeanDocument<QuotePartnerConfig> | null> {
    const foundConfig = await this.quotePartnerConfigModel.findOne({ partnerId }).lean();
    return foundConfig;
  }
}

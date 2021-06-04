import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { OperationResult } from '../app/common';
import { QuotePartnerConfig, QUOTE_PARTNER_CONFIG } from './quote-partner-config.schema';
import { QuotePartnerConfigDto } from './res/quote-partner-config.dto';

@Injectable()
export class QuotePartnerConfigService {
  constructor(@InjectModel(QUOTE_PARTNER_CONFIG) private readonly quotePartnerConfigModel: Model<QuotePartnerConfig>) {}

  async getConfigByPartnerId(partnerId: string): Promise<OperationResult<QuotePartnerConfigDto>> {
    const foundConfig = await this.quotePartnerConfigModel.findOne({ partnerId }).lean();
    if (!foundConfig) {
      throw ApplicationException.EntityNotFound(`QuotePartnerConfig with PartnerId: ${partnerId}`);
    }

    return OperationResult.ok(strictPlainToClass(QuotePartnerConfigDto, foundConfig));
  }

  // ========================== INTERNAL ==========================

  async getDetailByPartnerId(partnerId: string): Promise<LeanDocument<QuotePartnerConfig> | null> {
    const foundConfig = await this.quotePartnerConfigModel.findOne({ partnerId }).lean();
    return foundConfig;
  }
}

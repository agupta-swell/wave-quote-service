import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from '../app/common';
import { V2QuotePartnerConfig, V2_QUOTE_PARTNER_CONFIG } from './quote-partner-config.schema';
import { V2QuotePartnerConfigDto } from './res/quote-partner-config.dto';

@Injectable()
export class QuotePartnerConfigService {
  constructor(
    @InjectModel(V2_QUOTE_PARTNER_CONFIG) private readonly v2QuotePartnerConfigModel: Model<V2QuotePartnerConfig>,
  ) {}

  async getConfigByPartnerId(partnerId: string): Promise<OperationResult<V2QuotePartnerConfigDto>> {
    const foundConfig = await this.v2QuotePartnerConfigModel.findOne({ partnerId });
    if (!foundConfig) {
      throw ApplicationException.EnitityNotFound(partnerId);
    }

    return OperationResult.ok(new V2QuotePartnerConfigDto(foundConfig));
  }
}

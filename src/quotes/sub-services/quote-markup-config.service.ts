import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { QuoteMarkupConfig, QUOTE_MARKUP_CONFIG } from '../schemas';

@Injectable()
export class QuoteMarkupConfigService {
  constructor(
    @InjectModel(QUOTE_MARKUP_CONFIG)
    private readonly quoteMarkupConfigModel: Model<QuoteMarkupConfig>,
    @Inject(forwardRef(() => OpportunityService))
    private readonly opportunityService: OpportunityService,
  ) {}

  public async getAllByOppId(oppId: string): Promise<LeanDocument<QuoteMarkupConfig>[]> {
    const partnerId = await this.opportunityService.getPartnerId(oppId);

    const found = await this.quoteMarkupConfigModel.find({ partnerId }).lean();

    return found;
  }
}

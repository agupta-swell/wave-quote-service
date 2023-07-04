import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { GS_OPPORTUNITY_COLLECTION_NAME } from './constants';
import { IGsOpportunity } from './gs-opportunity.schema';

@Injectable()
export class GsOpportunityService {
  constructor(@InjectModel(GS_OPPORTUNITY_COLLECTION_NAME) private gsOpportunityModel: Model<IGsOpportunity>) {}
  // =====================> INTERNAL <=====================

  async findGsOpportunityById(gsOpportunityId: string): Promise<LeanDocument<IGsOpportunity> | null> {
    const result = await this.gsOpportunityModel.findById(gsOpportunityId).lean();

    return result;
  }
}

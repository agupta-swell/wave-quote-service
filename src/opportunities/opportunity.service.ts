import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Opportunity, OPPORTUNITY } from './opportunity.schema';

@Injectable()
export class OpportunityService {
  constructor(@InjectModel(OPPORTUNITY) private opportunityModel: Model<Opportunity>) {}

  // =====================> INTERNAL <=====================

  async isExistedOpportunity(opportunityId: string): Promise<boolean> {
    const res = await this.opportunityModel.findById(opportunityId);
    return !!res?._id;
  }

  async getContactIdById(opportunityId: string): Promise<string> {
    const res = await this.opportunityModel.findById(opportunityId);
    return res?.toObject()?.contactId;
  }
}

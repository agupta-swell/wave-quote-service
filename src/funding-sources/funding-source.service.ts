import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FundingSource, FUNDING_SOURCE } from './funding-source.schema';

@Injectable()
export class FundingSourceService {
  constructor(@InjectModel(FUNDING_SOURCE) private fundingSource: Model<FundingSource>) {}

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getDetail(id: string) {
    const product = await this.fundingSource.findById(id);
    return product;
  }
}

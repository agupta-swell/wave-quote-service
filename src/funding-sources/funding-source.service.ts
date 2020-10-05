import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult, Pagination } from 'src/app/common';
import { FundingSource, FUNDING_SOURCE } from './funding-source.schema';
import { FundingSourceDto } from './res/funding-source.dto';

@Injectable()
export class FundingSourceService {
  constructor(@InjectModel(FUNDING_SOURCE) private fundingSource: Model<FundingSource>) {}

  async getList(limit: number, skip: number): Promise<OperationResult<Pagination<FundingSourceDto>>> {
    const [fundingSources, total] = await Promise.all([
      this.fundingSource.find().limit(limit).skip(skip),
      this.fundingSource.countDocuments(),
    ]);

    return OperationResult.ok({
      data: fundingSources.map(fundingSource => new FundingSourceDto(fundingSource)),
      total,
    });
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getDetail(id: string) {
    const product = await this.fundingSource.findById(id);
    return product;
  }
}
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { OperationResult, Pagination } from 'src/app/common';
import { FundingSource, FUNDING_SOURCE } from './funding-source.schema';
import { FundingSourceDto } from './res/funding-source.dto';

@Injectable()
export class FundingSourceService {
  constructor(@InjectModel(FUNDING_SOURCE) private fundingSource: Model<FundingSource>) {}

  async getList(limit: number, skip: number): Promise<OperationResult<Pagination<FundingSourceDto>>> {
    const [fundingSources, total] = await Promise.all([
      this.fundingSource.find().limit(limit).skip(skip).lean(),
      this.fundingSource.countDocuments().lean(),
    ]);

    return OperationResult.ok(
      new Pagination({
        data: fundingSources.map(fundingSource => new FundingSourceDto(fundingSource)),
        total,
      }),
    );
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getDetailById(id: string): Promise<FundingSource | null> {
    const product = await this.fundingSource.findById(id);
    return product;
  }

  async getAll(): Promise<LeanDocument<FundingSource>[]> {
    const fundingSources = await this.fundingSource.find().lean();
    return fundingSources;
  }
}

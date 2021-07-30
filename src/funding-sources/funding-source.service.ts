import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { OperationResult, Pagination } from 'src/app/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
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
        data: strictPlainToClass(FundingSourceDto, fundingSources),
        total,
      }),
    );
  }

  async getFundingSourceById(fundingSourceId: string): Promise<OperationResult<FundingSourceDto>> {
    const result = await this.fundingSource.findById(fundingSourceId).lean();
    return OperationResult.ok(strictPlainToClass(FundingSourceDto, result));
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getFundingSourcesByIds(ids: string[]): Promise<LeanDocument<FundingSource[]> | null> {
    const fundingSources = await this.fundingSource
      .find({
        _id: {
          $in: ids,
        },
      })
      .lean();

    return fundingSources;
  }

  async getDetailById(id: string): Promise<FundingSource | null> {
    const product = await this.fundingSource.findById(id);
    return product;
  }

  async getAll(): Promise<LeanDocument<FundingSource>[]> {
    const fundingSources = await this.fundingSource.find().lean();
    return fundingSources;
  }
}

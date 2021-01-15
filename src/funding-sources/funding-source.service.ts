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

  async getAll(): Promise<FundingSource[]> {
    const fundingSources = await this.fundingSource.find();
    return fundingSources.length ? fundingSources.map(item => item.toObject({ versionKey: false })) : [];
  }
}

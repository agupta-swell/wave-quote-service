import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { OperationResult, Pagination } from '../app/common';
import { AdderConfig, ADDER_CONFIG } from './adder-config.schema';
import { AdderConfigDto } from './res/adder-config.dto';

@Injectable()
export class AdderConfigService {
  constructor(@InjectModel(ADDER_CONFIG) private adderConfigModel: Model<AdderConfig>) {}

  async getAllAdderConfigs(limit: number, skip: number): Promise<OperationResult<Pagination<AdderConfigDto>>> {
    const [panels, total] = await Promise.all([
      this.adderConfigModel.find().limit(limit).skip(skip).lean(),
      this.adderConfigModel.estimatedDocumentCount(),
    ]);

    return OperationResult.ok(new Pagination({ data: strictPlainToClass(AdderConfigDto, panels), total }));
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getAdderConfigDetail(id: string): Promise<LeanDocument<AdderConfig> | null> {
    const res = await this.adderConfigModel.findById(id).lean();
    return res;
  }
}

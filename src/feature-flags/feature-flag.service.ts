import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { OperationResult } from 'src/app/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { FEATURE_FLAG, IFeatureFlagDocument } from './feature-flag.schema';
import { FeatureFlagDto } from './res/feature-flag.dto';

export class FeatureFlagService {
  constructor(
    @InjectModel(FEATURE_FLAG)
    private featureFlagModel: Model<IFeatureFlagDocument>,
  ) {}

  async getAllFeatureFlags(): Promise<OperationResult<FeatureFlagDto[]>> {
    const res = await this.featureFlagModel.find().lean();
    return OperationResult.ok(strictPlainToClass(FeatureFlagDto, res));
  }
}

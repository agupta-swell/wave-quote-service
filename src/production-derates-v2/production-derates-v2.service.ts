import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { OperationResult } from 'src/app/common';
import { PRODUCTION_DERATES_COLLECTION_NAME } from './constants';
import { ProductionDeratesDocument } from './production-derates-v2.schema';
import { ProductionDeratesDto } from './res/production-derates-v2.dto';

export class ProductionDeratesService {
  constructor(
    @InjectModel(PRODUCTION_DERATES_COLLECTION_NAME) private productionDeratesModel: Model<ProductionDeratesDocument>,
  ) {}

  async getAllProductionDerates(): Promise<OperationResult<ProductionDeratesDto[]>> {
    const res = await this.productionDeratesModel.find().lean();
    return OperationResult.ok(strictPlainToClass(ProductionDeratesDto, res));
  }
}

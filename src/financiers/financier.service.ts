import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Types, Model, FilterQuery } from 'mongoose';
import { FINANCIER_COLLECTION } from './financier.constant';

import { Financier } from './financier.schema';

@Injectable()
export class FinancierService {
  constructor(
    @InjectModel(FINANCIER_COLLECTION)
    private readonly financierModel: Model<Financier>,
  ) {}

  async getAllFinanciersByIds(ids: string[]): Promise<LeanDocument<Financier>[]> {
    const financiers = await this.financierModel
      .find({
        _id: {
          $in: <any>ids.map(Types.ObjectId),
        },
        isActive: true,
      })
      .lean();

    return financiers;
  }

  async getAll(query?: FilterQuery<Financier>): Promise<LeanDocument<Financier>[]> {
    const financiers = await this.financierModel.find(query as any).lean();
    return financiers;
  }
}

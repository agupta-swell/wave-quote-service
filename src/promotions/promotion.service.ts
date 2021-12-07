import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { OperationResult, Pagination } from 'src/app/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { PROMOTION_COLLECTION } from './promotion.constant';
import { PromotionResDto } from './dto';
import { IPromotionDocument, IPromotion } from './interfaces';

@Injectable()
export class PromotionService {
  constructor(
    @InjectModel(PROMOTION_COLLECTION)
    private promotionModel: Model<IPromotionDocument>,
  ) {}

  public static parseActivePromotionDateValidation(): { $match: Record<string, unknown> } {
    const now = new Date();

    return {
      $match: {
        $or: [
          {
            endDate: {
              $gte: now,
            },
            startDate: {
              $lte: now,
            },
          },
          {
            startDate: null,
            endDate: null,
          },
          {
            startDate: null,
            endDate: {
              $gte: now,
            },
          },
          {
            startDate: {
              $lte: now,
            },
            endDate: null,
          },
        ],
      },
    };
  }

  public async getActivePromotionsAggregation(
    ...pipelines: Record<string, unknown>[]
  ): Promise<LeanDocument<IPromotionDocument>[]> {
    const res = await this.promotionModel.aggregate([
      PromotionService.parseActivePromotionDateValidation(),
      ...pipelines,
    ]);

    return res;
  }

  public static validate(discount: IPromotion): boolean {
    const now = new Date();

    const { startDate, endDate } = discount;

    if (!startDate && !endDate) {
      return true;
    }
    if (!startDate && endDate) {
      return now <= endDate;
    }
    if (startDate && !endDate) {
      return startDate <= now;
    }
    return startDate <= now && now <= endDate;
  }

  public getAll(): Promise<LeanDocument<IPromotionDocument>[]> {
    return this.promotionModel.find().lean().exec();
  }

  public async getOneById(id: string): Promise<LeanDocument<IPromotionDocument>> {
    const found = await this.promotionModel.findById(id).lean();

    if (!found) {
      throw new NotFoundException(`No promotion found with id '${id}'`);
    }

    return found;
  }

  public async getActivePromotions(
    pipelines: Record<string, unknown>[],
  ): Promise<OperationResult<Pagination<PromotionResDto>>> {
    const data = await this.getActivePromotionsAggregation(...pipelines);

    if (!data.length) {
      return OperationResult.ok(new Pagination({ total: 0, data: [] }));
    }

    return OperationResult.ok(
      new Pagination({
        total: data.length,
        data: strictPlainToClass(PromotionResDto, data),
      }),
    );
  }
}

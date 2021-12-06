import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { OperationResult, Pagination } from 'src/app/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { DISCOUNT_COLLECTION } from './discount.constant';
import { DiscountResDto } from './dto';
import { IDiscountDocument, IDiscount } from './interfaces';

@Injectable()
export class DiscountService {
  constructor(
    @InjectModel(DISCOUNT_COLLECTION)
    private discountModel: Model<IDiscountDocument>,
  ) {}

  public static parseActiveDiscountDateValidation(): { $match: Record<string, unknown> } {
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

  public async getActiveDiscountAggregation(
    ...pipelines: Record<string, unknown>[]
  ): Promise<LeanDocument<IDiscountDocument>[]> {
    const res = await this.discountModel.aggregate([DiscountService.parseActiveDiscountDateValidation(), ...pipelines]);

    return res;
  }

  public static validate(discount: IDiscount): boolean {
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

  public getAll(): Promise<LeanDocument<IDiscountDocument>[]> {
    return this.discountModel.find().lean().exec();
  }

  public async getOneById(id: string): Promise<LeanDocument<IDiscountDocument>> {
    const found = await this.discountModel.findById(id).lean();

    if (!found) {
      throw new NotFoundException(`No discount found with id '${id}'`);
    }

    return found;
  }

  public async getActiveDiscounts(
    pipelines: Record<string, unknown>[],
  ): Promise<OperationResult<Pagination<DiscountResDto>>> {
    const data = await this.getActiveDiscountAggregation(...pipelines);

    if (!data.length) {
      return OperationResult.ok(new Pagination({ total: 0, data: [] }));
    }

    // const validDiscounts = data.filter(discount => this.validate(discount));
    return OperationResult.ok(
      new Pagination({
        total: data.length,
        data: strictPlainToClass(DiscountResDto, data),
      }),
    );
  }
}

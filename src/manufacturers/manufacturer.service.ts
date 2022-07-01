import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, ObjectId } from 'mongoose';
import { OperationResult, Pagination } from 'src/app/common';
import { PRODUCT_COLL, PRODUCT_TYPE } from 'src/products-v2/constants';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { Manufacturer, V2_MANUFACTURERS_COLL } from './manufacturer.schema';
import { ManufacturerDto } from './res/manufacturer.dto';

interface IGetManufacturersByTypeResult {
  meta: { total: number };
  data: LeanDocument<Manufacturer>[];
}

export class ManufacturerService {
  constructor(@InjectModel(V2_MANUFACTURERS_COLL) private manufacturers: Model<Manufacturer>) {}

  async getList(
    limit?: number,
    skip?: number,
    by?: PRODUCT_TYPE,
  ): Promise<OperationResult<Pagination<ManufacturerDto>>> {
    if (skip && limit && by) {
      const res = await this.getManufacturersByType(skip, limit, by);

      return OperationResult.ok(
        new Pagination({
          data: strictPlainToClass(ManufacturerDto, res.data),
          total: res.meta.total,
        }),
      );
    }

    const getManufacturers = this.manufacturers.find();
    if (limit) getManufacturers.limit(limit);
    if (skip) getManufacturers.skip(skip);

    const [manufacturers, total] = await Promise.all([getManufacturers.lean(), this.manufacturers.countDocuments()]);

    return OperationResult.ok(
      new Pagination({
        data: strictPlainToClass(ManufacturerDto, manufacturers),
        total,
      }),
    );
  }

  async getOneById(id: string | ObjectId): Promise<LeanDocument<Manufacturer>> {
    const found = await this.manufacturers.findById(id).lean();

    if (!found) {
      throw new NotFoundException(`No manufacturer found with id ${id}`);
    }

    return found;
  }

  async getManufacturersByType(
    skip: number,
    limit: number,
    type: PRODUCT_TYPE,
  ): Promise<IGetManufacturersByTypeResult> {
    const res = await this.manufacturers.db
      .collection(PRODUCT_COLL)
      .aggregate<IGetManufacturersByTypeResult>([
        {
          $match: {
            type,
          },
        },
        {
          $group: {
            _id: '$manufacturer_id',
            sum: {
              $sum: 1,
            },
          },
        },
        {
          $facet: {
            meta: [
              {
                $count: 'total',
              },
            ],
            data: [
              {
                $skip: skip,
              },
              {
                $limit: limit,
              },
              {
                $lookup: {
                  from: 'v2_manufacturers',
                  localField: '_id',
                  foreignField: '_id',
                  as: 'manufacturers',
                },
              },
              {
                $replaceRoot: {
                  newRoot: {
                    $arrayElemAt: ['$manufacturers', 0],
                  },
                },
              },
            ],
          },
        },
      ])
      .toArray();

    return res[0];
  }

  async getManufacturersByIds(ids: ObjectId[]): Promise<LeanDocument<Manufacturer>[]> {
    const res = await this.manufacturers.find({ _id: { $in: ids } }).lean();

    return res;
  }
}

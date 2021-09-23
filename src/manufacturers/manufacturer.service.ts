import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, ObjectId, Types } from 'mongoose';
import { OperationResult, Pagination } from 'src/app/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { Manufacturer, MANUFACTURER } from './manufacturer.schema';
import { ManufacturerDto } from './res/manufacturer.dto';

export class ManufacturerService {
  constructor(@InjectModel(MANUFACTURER) private manufacturers: Model<Manufacturer>) {}

  async getList(limit: number, skip: number): Promise<OperationResult<Pagination<ManufacturerDto>>> {
    const [manufacturers, total] = await Promise.all([
      this.manufacturers.find().limit(limit).skip(skip).lean(),
      this.manufacturers.countDocuments(),
    ]);

    return OperationResult.ok(
      new Pagination({
        data: strictPlainToClass(ManufacturerDto, manufacturers),
        total,
      }),
    );
  }

  async getOneById(id: string): Promise<LeanDocument<Manufacturer>> {
    const found = await this.manufacturers.findOne({ _id: new Types.ObjectId(id) }).lean();

    if (!found) {
      throw new NotFoundException(`No manufacturer found with id ${id}`);
    }

    return found;
  }
}

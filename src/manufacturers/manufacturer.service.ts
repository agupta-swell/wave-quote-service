import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult, Pagination } from 'src/app/common';
import { Manufacturer, MANUFACTURER } from './manufacturer.schema';
import { ManufacturerDto } from './res/manufacturer.dto';

export class ManufacturerService {
  constructor(@InjectModel(MANUFACTURER) private manufacturers: Model<Manufacturer>) {}

  async getList(limit: number, skip: number): Promise<OperationResult<Pagination<ManufacturerDto>>> {
    const [manufacturers, total] = await Promise.all([
      this.manufacturers.find().limit(limit).skip(skip),
      this.manufacturers.countDocuments(),
    ]);

    return OperationResult.ok(
      new Pagination({
        data: manufacturers.map((manufacturer) => new ManufacturerDto(manufacturer)),
        total,
      }),
    );
  }
}

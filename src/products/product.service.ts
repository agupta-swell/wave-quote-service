import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { isObjectId } from 'src/utils/common';
import { OperationResult, Pagination } from '../app/common';
import { Product, PRODUCT } from './product.schema';
import { ProductDto } from './res/product.dto';

@Injectable()
export class ProductService {
  constructor(@InjectModel(PRODUCT) private productModel: Model<Product>) {}

  async getAllProductsByType(
    limit: number,
    skip: number,
    types: string[],
  ): Promise<OperationResult<Pagination<ProductDto>>> {
    const [panels, total] = await Promise.all([
      this.productModel
        .find({ type: { $in: types } })
        .limit(limit)
        .skip(skip),
      this.productModel.countDocuments({ type: { $in: types } }),
    ]);

    return OperationResult.ok(new Pagination({ data: panels.map((panel) => new ProductDto(panel)), total }));
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getDetailById(id: string): Promise<Product | null> {
    const product = await this.productModel.findById(isObjectId(id) ? Types.ObjectId(id) : id);
    return product;
  }
}

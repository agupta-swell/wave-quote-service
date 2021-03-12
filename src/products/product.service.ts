import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Types } from 'mongoose';
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
    hasRule: boolean | null,
  ): Promise<OperationResult<Pagination<ProductDto>>> {
    const condition = {
      type: { $in: types },
      [typeof hasRule === 'boolean' ? 'insertion_rule' : '']: { $exists: hasRule },
    };

    const [panels, total] = await Promise.all([
      this.productModel.find(condition).limit(limit).skip(skip).lean(),
      this.productModel.countDocuments(condition),
    ]);

    return OperationResult.ok(new Pagination({ data: panels.map(panel => new ProductDto(panel)), total }));
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getDetailById(id: string): Promise<LeanDocument<Product> | null> {
    const product = await this.productModel.findById(isObjectId(id) ? Types.ObjectId(id) : id).lean();
    return product;
  }
}

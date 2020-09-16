import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult, Pagination } from '../app/common';
import { Product, PRODUCT } from './product.schema';
import { ProductDto } from './res/product.dto';

@Injectable()
export class ProductService {
  constructor(@InjectModel(PRODUCT) private productModel: Model<Product>) {}

  async getDetail(id: string) {
    const product = await this.productModel.findById(id);
    return product;
  }

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

    return OperationResult.ok({ data: panels.map(panel => new ProductDto(panel)), total });
  }
}

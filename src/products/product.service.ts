import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Types } from 'mongoose';
import { isObjectId, transformToValidId } from 'src/utils/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { OperationResult, Pagination } from '../app/common';
import { Product, PRODUCT } from './product.schema';
import { UpdateProductDtoReq } from './req/update-product.dto';
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
      [typeof hasRule === 'boolean' ? 'insertionRule' : '']: { $exists: hasRule },
    };

    const [panels, total] = await Promise.all([
      this.productModel.find(condition).limit(limit).skip(skip).lean(),
      this.productModel.countDocuments(condition),
    ]);

    return OperationResult.ok(new Pagination({ data: strictPlainToClass(ProductDto, panels), total }));
  }

  async updateProduct(id: string, req: UpdateProductDtoReq): Promise<OperationResult<ProductDto>> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, { insertionRule: req.insertionRule }, { new: true })
      .lean();
    return OperationResult.ok(strictPlainToClass(ProductDto, updatedProduct));
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getDetailById(id: string): Promise<LeanDocument<Product> | null> {
    const product = await this.productModel.findById(isObjectId(id) ? Types.ObjectId(id) : id).lean();
    return product;
  }

  async getDetailByIdList(idList: string[]): Promise<LeanDocument<Product[]> | null> {
    const newIdList = idList.map(id => transformToValidId(id));
    const query = {
      _id: { $in: newIdList },
    };
    const product = await this.productModel.find(query).lean();

    return product;
  }
}

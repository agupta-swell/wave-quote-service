import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, PRODUCT } from './product.schema';

@Injectable()
export class ProductService {
  constructor(@InjectModel(PRODUCT) private productModel: Model<Product>) {}

  async getDetail(id: string) {
    const product = await this.productModel.findById(id);
    return product;
  }
}

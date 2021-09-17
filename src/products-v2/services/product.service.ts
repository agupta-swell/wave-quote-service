import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, LeanDocument, Model, Types } from 'mongoose';
import { isObjectId, transformToValidId } from 'src/utils/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { OperationResult, Pagination } from '../../app/common';
import { UpdateProductDtoReq } from '../req/update-product.dto';
import { ProductDto } from '../res/product.dto';
import { IProduct, IProductDocument, IUnknownProduct } from '../interfaces';
import { PRODUCT_MODEL_NAME, PRODUCT_TYPE } from '../constants';
import { GetAllProductsQueryDto } from '../req';

@Injectable()
export class ProductService {
  constructor(@InjectModel(PRODUCT_MODEL_NAME) private productModel: Model<IUnknownProduct>) {}

  async getAllProductsByType(query: GetAllProductsQueryDto): Promise<OperationResult<Pagination<ProductDto>>> {
    const { limit, skip, types, hasRule } = query;

    const condition: Record<string, unknown> = {
      type: { $in: types },
    };

    if (typeof hasRule === 'boolean') {
      condition.insertionRule = { $exists: hasRule };
    }

    const [panels, total] = await Promise.all([
      this.productModel.find(condition).limit(limit).skip(skip).lean(),
      this.productModel.countDocuments(condition),
    ]);

    return OperationResult.ok(new Pagination({ data: strictPlainToClass(ProductDto, panels), total }));
  }

  async updateProduct(id: string, req: UpdateProductDtoReq): Promise<OperationResult<ProductDto>> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, { insertionRule: req.insertionRule! }, { new: true })
      .lean();

    return OperationResult.ok(strictPlainToClass(ProductDto, updatedProduct));
  }

  async getDetailById(id: string): Promise<LeanDocument<IUnknownProduct> | null> {
    const product = await this.productModel.findById(isObjectId(id) ? Types.ObjectId(id) : id).lean();
    return product;
  }

  async getDetailByIdList(idList: string[]): Promise<LeanDocument<IUnknownProduct[]> | null> {
    const newIdList = idList.map(id => transformToValidId(id));
    const query = {
      _id: { $in: newIdList },
    };
    const product = await this.productModel.find(query).lean();

    return product;
  }

  public async getManyByQuery<T extends PRODUCT_TYPE>(
    condition: FilterQuery<IProduct<T>>,
  ): Promise<IProductDocument<T>[] | null> {
    const res = await this.productModel.find(condition as any);

    return this.extractType<T>(res);
  }

  public async getOneByQuery<T extends PRODUCT_TYPE>(
    condition: FilterQuery<IProduct<T>>,
  ): Promise<IProductDocument<T> | null> {
    const res = await this.productModel.findOne(condition as any);

    return this.extractType<T>(res);
  }

  public async getLeanManyByQuery<T extends PRODUCT_TYPE>(
    condition: FilterQuery<IProduct<T>>,
  ): Promise<LeanDocument<IProductDocument<T>[]> | null> {
    const res = await this.productModel.find(condition as any).lean();

    return this.extractLeanType<T>(res);
  }

  public async getLeanOneByQuery<T extends PRODUCT_TYPE>(
    condition: FilterQuery<IProduct<T>>,
  ): Promise<LeanDocument<IProductDocument<T>> | null> {
    const res = await this.productModel.findOne(condition as any).lean();

    return this.extractLeanType<T>(res);
  }

  private extractType<T extends PRODUCT_TYPE>(product: IUnknownProduct[]): IProductDocument<T>[];
  private extractType<T extends PRODUCT_TYPE>(product: IUnknownProduct | null): IProductDocument<T> | null;
  private extractType<T extends PRODUCT_TYPE>(product: any): any {
    return product;
  }

  private extractLeanType<T extends PRODUCT_TYPE>(
    product: LeanDocument<IUnknownProduct[]>,
  ): LeanDocument<IProductDocument<T>[]>;
  private extractLeanType<T extends PRODUCT_TYPE>(
    product: LeanDocument<IUnknownProduct> | null,
  ): LeanDocument<IProductDocument<T>> | null;
  private extractLeanType<T extends PRODUCT_TYPE>(product: any): any {
    return product;
  }
}

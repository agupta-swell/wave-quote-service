import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, LeanDocument, Model, ObjectId, Types, UpdateQuery } from 'mongoose';
import { isObjectId, transformToValidId } from 'src/utils/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { OperationResult, Pagination } from '../../app/common';
import { UpdateProductDtoReq } from '../req/update-product.dto';
import { ProductResDto } from '../res/product.dto';
import { IProduct, IProductDocument, IUnknownProduct } from '../interfaces';
import { PRODUCT_MODEL_NAME, PRODUCT_TYPE } from '../constants';
import { GetAllProductsQueryDto } from '../req';

@Injectable()
export class ProductService {
  constructor(@InjectModel(PRODUCT_MODEL_NAME) private productModel: Model<IUnknownProduct>) {}

  async getAllProductsByType(query: GetAllProductsQueryDto): Promise<OperationResult<Pagination<ProductResDto>>> {
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

    return OperationResult.ok(new Pagination({ data: strictPlainToClass(ProductResDto, panels), total }));
  }

  async updateProduct(id: string, req: UpdateProductDtoReq): Promise<OperationResult<ProductResDto>> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, { insertionRule: req.insertionRule! }, { new: true })
      .lean();

    return OperationResult.ok(strictPlainToClass(ProductResDto, updatedProduct));
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
  ): Promise<LeanDocument<IProductDocument<T>>[]> {
    const res = await this.productModel.find(condition as any).lean();

    return this.extractLeanType<T>(res);
  }

  public async getLeanOneByQuery<T extends PRODUCT_TYPE>(
    condition: FilterQuery<IProduct<T>>,
  ): Promise<LeanDocument<IProductDocument<T>> | null> {
    const res = await this.productModel.findOne(condition as any).lean();

    return this.extractLeanType<T>(res);
  }

  public async getDetailByIdAndType<TProductType extends PRODUCT_TYPE>(
    type: TProductType,
    id: string,
  ): Promise<LeanDocument<IProductDocument<TProductType>>> {
    const found = await this.productModel
      .findOne({
        type,
        _id: new Types.ObjectId(id),
      })
      .lean();

    const mappedProduct = this.extractLeanType<TProductType>(found);

    if (!mappedProduct) {
      throw new NotFoundException(`No product found with type ${type}, id ${id}`);
    }

    return mappedProduct;
  }

  public async findByIdAndTypeAndUpdate<TProductType extends PRODUCT_TYPE>(
    type: TProductType,
    id: string | ObjectId,
    update: UpdateQuery<IProductDocument<TProductType>>,
  ): Promise<IProductDocument<TProductType> | null> {
    const model = await this.productModel.findOneAndUpdate(
      {
        _id: typeof id === 'string' ? new Types.ObjectId(id) : id,
        type: type,
      },
      update as any,
      { new: true },
    );

    return this.extractType<TProductType>(model);
  }

  private extractType<T extends PRODUCT_TYPE>(product: IUnknownProduct[]): IProductDocument<T>[];
  private extractType<T extends PRODUCT_TYPE>(product: IUnknownProduct | null): IProductDocument<T> | null;
  private extractType(product: any): any {
    return product;
  }

  private extractLeanType<T extends PRODUCT_TYPE>(
    product: LeanDocument<IUnknownProduct>[],
  ): LeanDocument<IProductDocument<T>>[];
  private extractLeanType<T extends PRODUCT_TYPE>(
    product: LeanDocument<IUnknownProduct> | null,
  ): LeanDocument<IProductDocument<T>> | null;
  private extractLeanType(product: any): any {
    return product;
  }
}

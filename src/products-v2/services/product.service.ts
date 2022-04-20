import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, LeanDocument, Model, ObjectId, Types, UpdateQuery } from 'mongoose';
import { isObjectId, transformToValidId } from 'src/utils/common';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { InjectBucket } from 'src/shared/mongo/decorators/inject-bucket';
import { FastifyFile } from 'src/shared/fastify';
import { GridFSPromiseBucket } from 'src/shared/mongo';
import type { GridFSBucketReadStream } from 'mongodb';
import { OperationResult, Pagination } from '../../app/common';
import { SaveInsertionRuleReq } from '../req/save-insertion-rule.dto';
import { ProductResDto } from '../res/product.dto';
import { IProduct, IProductDocument, IUnknownProduct } from '../interfaces';
import { PRODUCT_MODEL_NAME, PRODUCT_TYPE, PRODUCT_BUCKET } from '../constants';
import { GetAllProductsQueryDto } from '../req';
import { ValidateUploadBatteryAssetsInterceptor } from '../interceptors/validate-upload-battery-assets.interceptor';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(PRODUCT_MODEL_NAME) private productModel: Model<IUnknownProduct>,
    @InjectBucket(PRODUCT_BUCKET) private productImageBucket: GridFSPromiseBucket,
  ) {}

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

  async saveInsertionRule(id: ObjectId, req: SaveInsertionRuleReq): Promise<OperationResult<ProductResDto>> {
    const foundProduct = await this.productModel.findOne({ _id: id });

    if (!foundProduct) {
      throw new NotFoundException(`No product found with id ${id.toString()}`);
    }

    if (
      ![
        PRODUCT_TYPE.ANCILLARY_EQUIPMENT,
        PRODUCT_TYPE.BALANCE_OF_SYSTEM,
        PRODUCT_TYPE.SOFT_COST,
        PRODUCT_TYPE.LABOR,
      ].includes(foundProduct.type)
    ) {
      throw new BadRequestException('Only ancillary equipment/balance of system/soft cost/labor product is allowed');
    }

    const mappedProduct = this.extractType<
      PRODUCT_TYPE.ANCILLARY_EQUIPMENT | PRODUCT_TYPE.BALANCE_OF_SYSTEM | PRODUCT_TYPE.SOFT_COST | PRODUCT_TYPE.LABOR
    >(foundProduct);

    mappedProduct.insertionRule = req.insertionRule;

    await mappedProduct.save();

    return OperationResult.ok(strictPlainToClass(ProductResDto, mappedProduct.toJSON()));
  }

  async getDetailById(id: string): Promise<LeanDocument<IUnknownProduct> | null> {
    const product = await this.productModel.findById(isObjectId(id) ? Types.ObjectId(id) : id).lean();
    return product;
  }

  async getDetailByIdList(idList: string[]): Promise<LeanDocument<IUnknownProduct[]> | null> {
    const newIdList = idList.map(id => transformToValidId(id));
    const query = {
      manufacturer_id: { $in: newIdList },
    };
    const product = await this.productModel.find(query).lean();

    return product;
  }

  async getDetailByIds(idList: string[]): Promise<LeanDocument<IUnknownProduct[]>> {
    const newIdList = idList.map(id => transformToValidId(id));

    const products = await this.productModel
      .find({
        _id: {
          $in: newIdList,
        },
      })
      .lean();

    return products;
  }

  async uploadBatteryAsset(battery: IProductDocument<PRODUCT_TYPE.BATTERY>, asset: FastifyFile): Promise<string> {
    const filename = `${battery._id.toString()}_${Date.now()}.${asset.filename.split('.').at(-1)}`;

    await this.productImageBucket.uploadPromise(filename, asset.file, {
      contentType: asset.mimetype,
    });

    return filename;
  }

  async saveBatteryAssets(
    battery: IProductDocument<PRODUCT_TYPE.BATTERY>,
    assets: AsyncIterableIterator<FastifyFile>,
  ): Promise<OperationResult<ProductResDto>> {
    await ValidateUploadBatteryAssetsInterceptor.getMultiparts(assets, async file => {
      if (!file) return;

      if (file.image) {
        const imagePath = await this.uploadBatteryAsset(battery, file.image);

        battery.productImage = `/v2/products/assets/${imagePath}`;
        return;
      }

      if (file.datasheet) {
        const datasheetPath = await this.uploadBatteryAsset(battery, file.datasheet);

        battery.productDataSheet = `/v2/products/assets/${datasheetPath}`;
      }
    });

    if (battery.isModified()) {
      battery.updatedAt = new Date();
      await battery.save();
    }

    return OperationResult.ok(strictPlainToClass(ProductResDto, battery.toJSON()));
  }

  async getAsset(filename: string, since?: Date): Promise<[string, Date, GridFSBucketReadStream] | undefined> {
    const files = await this.productImageBucket
      .find({
        filename,
      })
      .limit(1)
      .toArray();

    if (!files.length) throw new NotFoundException(`No file found with filename ${filename}`);

    const [file] = files;

    if (since && Math.floor(+file.uploadDate / 1000) <= Math.floor(+since / 1000)) return undefined;

    return [file.contentType, file.uploadDate, this.productImageBucket.openDownloadStreamByName(filename)];
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

    if (!res) return null;

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

    if (!res) return null;

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

    if (!found) {
      throw new NotFoundException(`No product found with type ${type}, id ${id}`);
    }

    const mappedProduct = this.extractLeanType<TProductType>(found);

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
        type,
      },
      update as any,
      { new: true },
    );

    if (!model) {
      throw new NotFoundException(`No product found with type ${type}, id ${id}`);
    }

    return this.extractType<TProductType>(model);
  }

  private extractType<T extends PRODUCT_TYPE>(product: IUnknownProduct[]): IProductDocument<T>[];

  private extractType<T extends PRODUCT_TYPE>(product: IUnknownProduct): IProductDocument<T>;

  private extractType(product: any): any {
    return product;
  }

  private extractLeanType<T extends PRODUCT_TYPE>(
    product: LeanDocument<IUnknownProduct>[],
  ): LeanDocument<IProductDocument<T>>[];

  private extractLeanType<T extends PRODUCT_TYPE>(
    product: LeanDocument<IUnknownProduct>,
  ): LeanDocument<IProductDocument<T>>;

  private extractLeanType(product: any): any {
    return product;
  }
}

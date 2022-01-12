/* eslint-disable consistent-return */
/* eslint-disable no-restricted-syntax */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  forwardRef,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EMPTY, Observable } from 'rxjs';
import { ApplicationException } from 'src/app/app.exception';
import { catchError } from 'rxjs/operators';
import { FastifyFile, FastifyRequest, FastifyResponse } from '../../shared/fastify';
import { ParseObjectIdPipe } from '../../shared/pipes/parse-objectid.pipe';
import { KEYS, PRODUCT_TYPE } from '../constants';
import { ProductService } from '../services';
import { IProductDocument } from '../interfaces';

export interface IBatteryAssets {
  image?: FastifyFile;
  datasheet?: FastifyFile;
}

@Injectable()
export class ValidateUploadBatteryAssetsInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const productIdProp = this.reflector.get<string>(KEYS.REQ_PARAM_ID, context.getHandler());

    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const response = context.switchToHttp().getResponse<FastifyResponse>();

    if (!request.isMultipart()) throw new BadRequestException('Must be a multipart request');

    const productId = (<Record<string, any>>request.params)[productIdProp];

    const product = await this.validateBatteryProduct(productId);

    Object.defineProperty(request, 'body', { value: request.files() });
    Object.defineProperty(request.params, productIdProp, { value: product });

    return next.handle().pipe(
      catchError(err => {
        response.send(err);
        request.raw.destroy();

        return EMPTY;
      }),
    );
  }

  private async validateBatteryProduct(productId: string): Promise<IProductDocument<PRODUCT_TYPE.BATTERY>> {
    const id = ParseObjectIdPipe.validate(productId);

    if (!id) throw ApplicationException.ValidationFailed('Must be a valid Mongo ObjectID String');

    const foundProduct = await this.productService.getOneByQuery<PRODUCT_TYPE.BATTERY>({
      _id: id as any,
      type: PRODUCT_TYPE.BATTERY,
    });

    if (!foundProduct) throw new NotFoundException(`No battery found with id ${productId}`);

    return foundProduct;
  }

  public static async getMultiparts(
    iterator: AsyncIterableIterator<FastifyFile>,
    fileHandler: (file?: IBatteryAssets) => Promise<void>,
  ): Promise<void> {
    for await (const file of iterator) {
      const parsedFile = this.parseFile(file);
      await fileHandler(parsedFile);
    }
  }

  private static parseFile(formFile: FastifyFile): IBatteryAssets | undefined {
    const { file, fieldname } = formFile;

    if (!file) throw ApplicationException.ValidationFailed('Invalid file');

    if (fieldname === 'image')
      return {
        image: formFile,
      };

    if (fieldname === 'datasheet')
      return {
        datasheet: formFile,
      };

    throw ApplicationException.ValidationFailed('Invalid file');
  }
}

import { Body, Controller, Get, Header, Headers, Param, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { PreAuthenticate, Public } from 'src/app/securities';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { ObjectId } from 'mongoose';
import { FastifyFile, FastifyResponse } from 'src/shared/fastify';
import { ProductService } from './services';
import { SaveInsertionRuleReq } from './req/save-insertion-rule.dto';
import { ProductResDto, ProductResponse } from './res/product.dto';
import { GetAllProductsQueryDto } from './req';
import { IProduct, IProductDocument } from './interfaces';
import { PRODUCT_TYPE } from './constants';
import { UseUploadBatteryAssetsValidation } from './interceptors';
import { IBatteryAssets } from './interceptors/validate-upload-battery-assets.interceptor';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('/v2/products')
@PreAuthenticate()
export class ProductControllerV2 {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiQuery({ name: 'limit' })
  @ApiQuery({ name: 'skip' })
  @ApiQuery({ name: 'types' })
  @ApiQuery({ name: 'has-rule' })
  @ApiOperation({ summary: 'Get all products by type' })
  @ApiOkResponse({ type: ProductResponse })
  async getAllProductsByType(
    @Query() query: GetAllProductsQueryDto,
  ): Promise<ServiceResponse<Pagination<ProductResDto>>> {
    const result = await this.productService.getAllProductsByType(query);
    return ServiceResponse.fromResult(result);
  }

  @Post('/:id/insertion-rule')
  async saveInsertionRule(
    @Param('id', ParseObjectIdPipe) id: ObjectId,
    @Body() req: SaveInsertionRuleReq,
  ): Promise<ServiceResponse<Pagination<ProductResDto>>> {
    const res = await this.productService.saveInsertionRule(id, req);
    return ServiceResponse.fromResult(res);
  }

  @Put('/:id/assets')
  @UseUploadBatteryAssetsValidation('id')
  async saveProductAssets(
    @Param('id') product: IProductDocument<PRODUCT_TYPE.BATTERY>,
    @Body() assets: AsyncIterableIterator<FastifyFile>,
  ): Promise<ServiceResponse<Pagination<ProductResDto>>> {
    const res = await this.productService.saveBatteryAssets(product, assets);
    return ServiceResponse.fromResult(res);
  }

  @Get('/assets/:filename')
  @Public()
  async getProductAsset(
    @Res() res: FastifyResponse,
    @Param('filename') filename: string,
    @Headers('if-modified-since') since?: string,
  ) {
    let lastModified: Date | undefined;
    if (since) lastModified = new Date(since);

    const file = await this.productService.getAsset(filename, lastModified);

    if (!file) {
      res.code(304).send();
      return;
    }

    const [contentType, date, stream] = file;

    if (contentType.startsWith('image')) res.header('Cache-Control', 'public, max-age=0');

    res.header('Last-Modified', date.toUTCString());
    res.header('Content-Type', contentType);

    res.send(stream);
  }
}

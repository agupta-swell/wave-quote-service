import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { getBooleanString } from 'src/utils/common';
import { ProductService } from './services';
import { UpdateProductDtoReq } from './req/update-product.dto';
import { ProductDto, ProductResponse } from './res/product.dto';
import { GetAllProductsQueryDto } from './req';

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
  async getAllProductsByType(@Query() query: GetAllProductsQueryDto): Promise<ServiceResponse<Pagination<ProductDto>>> {
    const result = await this.productService.getAllProductsByType(query);
    return ServiceResponse.fromResult(result);
  }
}

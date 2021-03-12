import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { getBooleanString } from 'src/utils/common';
import { ProductService } from './product.service';
import { ProductDto, ProductResponse } from './res/product.dto';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('/products')
@PreAuthenticate()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiQuery({ name: 'limit' })
  @ApiQuery({ name: 'skip' })
  @ApiQuery({ name: 'types' })
  @ApiQuery({ name: 'has-rule' })
  @ApiOperation({ summary: 'Get all products by type' })
  @ApiOkResponse({ type: ProductResponse })
  async getAllProductsByType(
    @Query() query: { limit: string; skip: string; types: string; 'has-rule': string },
  ): Promise<ServiceResponse<Pagination<ProductDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const types = query.types.split(',');
    const hasRule = query['has-rule'] ? getBooleanString(query['has-rule']) : null;
    const result = await this.productService.getAllProductsByType(limit, skip, types, hasRule);
    return ServiceResponse.fromResult(result);
  }
}

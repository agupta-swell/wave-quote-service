import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { ProductService } from './product.service';
import { ProductDto } from './res/product.dto';

@ApiTags('Products')
@Controller('/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products by type' })
  @ApiOkResponse({ type: Pagination })
  async getQuotings(
    @Query() query: { limit: string; skip: string; types: string },
  ): Promise<ServiceResponse<Pagination<ProductDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const types = query.types.split(',');
    const result = await this.productService.getAllProductsByType(limit, skip, types);
    return ServiceResponse.fromResult(result);
  }
}

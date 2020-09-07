import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { ProductService } from './product.service';
import { ProductDto } from './res/product.dto';

@ApiTags('Products')
@Controller('/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('/panels')
  @ApiOperation({ summary: 'Get all panels' })
  @ApiOkResponse({ type: Pagination })
  async getQuotings(@Query() query: { limit: string; skip: string }): Promise<ServiceResponse<Pagination<ProductDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const result = await this.productService.getAllPanels(limit, skip);
    return ServiceResponse.fromResult(result);
  }
}

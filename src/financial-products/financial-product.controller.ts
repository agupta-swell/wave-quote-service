import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { FinancialProductsService } from './financial-product.service';
import { FinancialProductDto } from './res/financial-product.dto';

@ApiTags('Financial Products')
@ApiBearerAuth()
@Controller('financial-products')
@PreAuthenticate()
export class FinancialProductsController {
  constructor(private readonly financialProductService: FinancialProductsService) {}

  @Get()
  @ApiQuery({ name: 'limit' })
  @ApiQuery({ name: 'skip' })
  @ApiQuery({ name: 'systemDesignId' })
  @ApiOperation({ summary: 'Get all financial product' })
  async getFinancialProduct(
    @Query() query: { limit: string; skip: string; systemDesignId: string; quoteType: string },
  ): Promise<ServiceResponse<Pagination<FinancialProductDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const result = await this.financialProductService.getList(limit, skip, query.systemDesignId);
    return ServiceResponse.fromResult(result);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { Pagination, ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
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
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('systemDesignId', ParseObjectIdPipe) systemDesignId: ObjectId,
  ): Promise<ServiceResponse<Pagination<FinancialProductDto>>> {
    const limitNumber = Number(limit || 100);
    const skipNumber = Number(skip || 0);
    const result = await this.financialProductService.getList(limitNumber, skipNumber, systemDesignId);
    return ServiceResponse.fromResult(result);
  }
}

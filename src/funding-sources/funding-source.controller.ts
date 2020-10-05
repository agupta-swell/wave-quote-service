import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FundingSourceService } from './funding-source.service';

@ApiTags('Funding Source')
@Controller('/funding-sources')
export class ProductController {
  constructor(private readonly fundingSourceService: FundingSourceService) {}

  //   @Get()
  //   @ApiQuery({ name: 'limit' })
  //   @ApiQuery({ name: 'skip' })
  //   @ApiQuery({ name: 'types' })
  //   @ApiOperation({ summary: 'Get all products by type' })
  //   async getQuotings(
  //     @Query() query: { limit: string; skip: string; types: string },
  //   ): Promise<ServiceResponse<Pagination<ProductDto>>> {
  //     const limit = Number(query.limit || 100);
  //     const skip = Number(query.skip || 0);
  //     const types = query.types.split(',');
  //     const result = await this.productService.getAllProductsByType(limit, skip, types);
  //     return ServiceResponse.fromResult(result);
  //   }
}

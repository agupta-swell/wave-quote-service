import { Controller, Get, Query } from '@nestjs/common';
import { Pagination, ServiceResponse } from 'src/app/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PreAuthenticate } from 'src/app/securities';
import { GetAllDiscountQueryDto } from './dto/req';
import { ParseGetAllDiscountsQueryPipe } from './pipes';
import { DiscountService } from './discount.service';
import { DiscountListRes, DiscountResDto } from './dto';

@ApiTags('Discounts')
@ApiBearerAuth()
@Controller('/discounts')
@PreAuthenticate()
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Get()
  @ApiOperation({ summary: 'Get all discounts' })
  @ApiQuery({
    type: GetAllDiscountQueryDto,
    required: false,
  })
  @ApiOkResponse({ type: DiscountListRes })
  async getAllDiscounts(
    @Query(ParseGetAllDiscountsQueryPipe) pipelines: GetAllDiscountQueryDto,
  ): Promise<ServiceResponse<Pagination<DiscountResDto>>> {
    const res = await this.discountService.getActiveDiscounts((pipelines as unknown) as Record<string, unknown>[]);
    return ServiceResponse.fromResult(res);
  }
}

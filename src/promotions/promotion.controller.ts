import { Controller, Get, Query } from '@nestjs/common';
import { Pagination, ServiceResponse } from 'src/app/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PreAuthenticate } from 'src/app/securities';
import { GetAllPromotionsQueryDto } from './dto/req';
import { ParseGetAllPromotionsQueryPipe } from './pipes';
import { PromotionService } from './promotion.service';
import { PromotionListRes, PromotionResDto } from './dto';

@ApiTags('Promotions')
@ApiBearerAuth()
@Controller('/promotions')
@PreAuthenticate()
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all promotions' })
  @ApiQuery({
    type: GetAllPromotionsQueryDto,
    required: false,
  })
  @ApiOkResponse({ type: PromotionListRes })
  async getAllPromotions(
    @Query(ParseGetAllPromotionsQueryPipe) pipelines: GetAllPromotionsQueryDto,
  ): Promise<ServiceResponse<Pagination<PromotionResDto>>> {
    const res = await this.promotionService.getActivePromotions((pipelines as unknown) as Record<string, unknown>[]);
    return ServiceResponse.fromResult(res);
  }
}

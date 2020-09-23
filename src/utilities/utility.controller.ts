import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { CalculateActualUsageCostDto } from './req/calculate-actual-usage-cost.dto';
import { TariffDto, UtilityDto } from './res';
import { CostData } from './res/cost-data.dto';
import { UtilityService } from './utility.service';

@ApiTags('Utilities')
@Controller('/utilities')
export class UtilityController {
  constructor(private readonly utilityService: UtilityService) {}

  @Get('/typical-baselines')
  @ApiOkResponse({ type: UtilityDto })
  async getTypicalBaseline(@Query('zipCode') zipCode: string): Promise<ServiceResponse<UtilityDto>> {
    const res = await this.utilityService.getTypicalBaseline(Number(zipCode));
    return ServiceResponse.fromResult(res);
  }

  @Get('/tariffs')
  @ApiOkResponse({ type: TariffDto, isArray: true })
  async getTariff(@Query() query: { zipCode: string; lseId: string }): Promise<ServiceResponse<TariffDto>> {
    const res = await this.utilityService.getTariffs(Number(query.zipCode), Number(query.lseId || 734));
    return ServiceResponse.fromResult(res);
  }

  @Get('/typical-usage-costs')
  @ApiQuery({ name: 'zipCode', required: true })
  @ApiQuery({ name: 'masterTariffId', required: true })
  @ApiOkResponse({ type: CostData })
  async calculateTypicalUsageCost(
    @Query() query: { zipCode: string; masterTariffId: string },
  ): Promise<ServiceResponse<CostData>> {
    const res = await this.utilityService.calculateTypicalUsageCost(
      Number(query.zipCode),
      query.masterTariffId || '522',
    );
    return ServiceResponse.fromResult(res);
  }

  @Post('/actual-usage-costs')
  @ApiOkResponse({ type: CostData })
  async calculateActualUsageCost(@Body() data: CalculateActualUsageCostDto): Promise<ServiceResponse<CostData>> {
    const res = await this.utilityService.calculateActualUsageCost(data);
    return ServiceResponse.fromResult(res);
  }
}

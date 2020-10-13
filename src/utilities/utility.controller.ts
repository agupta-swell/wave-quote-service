import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { CalculateActualUsageCostDto, GetActualUsageDto } from './req';
import { CreateUtilityDto } from './req/create-utility.dto';
import { TariffDto, UtilityDataDto } from './res';
import { CostDataDto } from './res/cost-data.dto';
import { UtilityDetailsDto } from './res/utility-details.dto';
import { UtilityService } from './utility.service';

@ApiTags('Utilities')
@Controller('/utilities')
export class UtilityController {
  constructor(private readonly utilityService: UtilityService) {}

  @Get('/typical-baselines')
  @ApiOkResponse({ type: UtilityDataDto })
  async getTypicalBaseline(@Query('zipCode') zipCode: string): Promise<ServiceResponse<UtilityDataDto>> {
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
  @ApiOkResponse({ type: CostDataDto })
  async calculateTypicalUsageCost(
    @Query() query: { zipCode: string; masterTariffId: string },
  ): Promise<ServiceResponse<CostDataDto>> {
    const res = await this.utilityService.calculateTypicalUsageCost(
      Number(query.zipCode),
      query.masterTariffId || '522',
    );
    return ServiceResponse.fromResult(res);
  }

  @Post('/actual-usage-costs')
  @ApiOkResponse({ type: CostDataDto })
  async calculateActualUsageCost(@Body() data: CalculateActualUsageCostDto): Promise<ServiceResponse<CostDataDto>> {
    const res = await this.utilityService.calculateActualUsageCost(data);
    return ServiceResponse.fromResult(res);
  }

  @Post('/actual-usages')
  @ApiOkResponse({ type: UtilityDataDto })
  async getActualUsages(@Body() data: GetActualUsageDto): Promise<ServiceResponse<UtilityDataDto>> {
    const res = await this.utilityService.getActualUsages(data);
    return ServiceResponse.fromResult(res);
  }

  @Post()
  @ApiOperation({ summary: 'create a utility usage detail' })
  async createUtility(@Body() utility: CreateUtilityDto): Promise<ServiceResponse<UtilityDetailsDto>> {
    const res = await this.utilityService.createUtilityUsageDetail(utility);
    return ServiceResponse.fromResult(res);
  }

  @Put('/:utilityId')
  @ApiOperation({ summary: 'update a utility usage detail' })
  async updateUtility(
    @Param('utilityId') utilityId: string,
    @Body() utilityDto: CreateUtilityDto,
  ): Promise<ServiceResponse<UtilityDetailsDto>> {
    const res = await this.utilityService.updateUtilityUsageDetail(utilityId, utilityDto);
    return ServiceResponse.fromResult(res);
  }

  @Get('/:opportunityId')
  @ApiOperation({ summary: 'get utility usage detail by opportunityId' })
  async getUtilityUsageDetail(
    @Param('opportunityId') opportunityId: string,
  ): Promise<ServiceResponse<UtilityDetailsDto>> {
    const res = await this.utilityService.getUtilityUsageDetail(opportunityId);
    return ServiceResponse.fromResult(res);
  }
}

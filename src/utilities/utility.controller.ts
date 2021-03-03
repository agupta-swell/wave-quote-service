import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { CheckOpportunity } from 'src/app/opportunity.pipe';
import { PreAuthenticate } from '../app/securities';
import { CalculateActualUsageCostDto, GetActualUsageDto } from './req';
import { CreateUtilityDto } from './req/create-utility.dto';
import { LoadServingEntity, TariffDto, UtilityDataDto } from './res';
import { CostDataDto } from './res/cost-data.dto';
import { UtilityDetailsDto } from './res/utility-details.dto';
import { UtilityService } from './utility.service';

@ApiTags('Utilities')
@ApiBearerAuth()
@Controller('/utilities')
@PreAuthenticate()
export class UtilityController {
  constructor(private readonly utilityService: UtilityService) {}

  @Get('/load-serving-entities')
  @ApiOperation({ summary: 'Get Load Serving Entity' })
  @ApiOkResponse({ type: UtilityDataDto })
  async getLoadServingEntities(
    @Query('zipCode', ParseIntPipe) zipCode: string,
  ): Promise<ServiceResponse<LoadServingEntity[]>> {
    console.log('here');
    const res = await this.utilityService.getLoadServingEntities(Number(zipCode));
    return ServiceResponse.fromResult(res);
  }

  @Get('/typical-baselines')
  @ApiOperation({ summary: 'Get Typical Baselines' })
  @ApiOkResponse({ type: UtilityDataDto })
  async getTypicalBaseline(@Query('zipCode') zipCode: string): Promise<ServiceResponse<UtilityDataDto>> {
    const res = await this.utilityService.getTypicalBaseline(Number(zipCode));
    return ServiceResponse.fromResult(res);
  }

  @Get('/tariffs')
  @ApiOperation({ summary: 'Get Tariff List' })
  @ApiOkResponse({ type: TariffDto, isArray: true })
  async getTariff(@Query() query: { zipCode: string; lseId: string }): Promise<ServiceResponse<TariffDto>> {
    const res = await this.utilityService.getTariffs(Number(query.zipCode), Number(query.lseId));
    return ServiceResponse.fromResult(res);
  }

  @Get('/typical-usage-costs')
  @ApiOperation({ summary: 'Get Typical Usage Cost' })
  @ApiQuery({ name: 'zipCode', required: true })
  @ApiQuery({ name: 'masterTariffId', required: true })
  @ApiOkResponse({ type: CostDataDto })
  async calculateTypicalUsageCost(
    @Query() query: { zipCode: string; masterTariffId: string },
  ): Promise<ServiceResponse<CostDataDto>> {
    const res = await this.utilityService.calculateTypicalUsageCost(Number(query.zipCode), query.masterTariffId);
    return ServiceResponse.fromResult(res);
  }

  @Post('/actual-usage-costs')
  @ApiOperation({ summary: 'Get Actual Usage Cost' })
  @ApiOkResponse({ type: CostDataDto })
  async calculateActualUsageCost(@Body() data: CalculateActualUsageCostDto): Promise<ServiceResponse<CostDataDto>> {
    const res = await this.utilityService.calculateActualUsageCost(data);
    return ServiceResponse.fromResult(res);
  }

  @Post('/actual-usages')
  @ApiOperation({ summary: 'Create Actual Usage' })
  @ApiOkResponse({ type: UtilityDataDto })
  async createActualUsages(@Body() data: GetActualUsageDto): Promise<ServiceResponse<UtilityDataDto>> {
    const res = await this.utilityService.createActualUsages(data);
    return ServiceResponse.fromResult(res);
  }

  @Post()
  @ApiOperation({ summary: 'Create A Utility Usage Detail' })
  @ApiOkResponse({ type: UtilityDetailsDto })
  @CheckOpportunity()
  async createUtility(@Body() utility: CreateUtilityDto): Promise<ServiceResponse<UtilityDetailsDto>> {
    const res = await this.utilityService.createUtilityUsageDetail(utility);
    return ServiceResponse.fromResult(res);
  }

  @Put('/:utilityId')
  @ApiOperation({ summary: 'Update A Utility Usage Detail' })
  @ApiOkResponse({ type: UtilityDetailsDto })
  @CheckOpportunity()
  async updateUtility(
    @Param('utilityId') utilityId: string,
    @Body() utilityDto: CreateUtilityDto,
  ): Promise<ServiceResponse<UtilityDetailsDto>> {
    const res = await this.utilityService.updateUtilityUsageDetail(utilityId, utilityDto);
    return ServiceResponse.fromResult(res);
  }

  @Get('/:opportunityId')
  @ApiOperation({ summary: 'Get Utility Usage Detail By opportunityId' })
  @ApiOkResponse({ type: UtilityDetailsDto })
  @CheckOpportunity()
  async getUtilityUsageDetail(
    @Param('opportunityId') opportunityId: string,
  ): Promise<ServiceResponse<UtilityDetailsDto>> {
    const res = await this.utilityService.getUtilityUsageDetail(opportunityId);
    return ServiceResponse.fromResult(res);
  }
}

import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { Observable } from 'rxjs';
import { ServiceResponse } from 'src/app/common';
import { CheckOpportunity } from 'src/app/opportunity.pipe';
import { ValidateAndSnapshotElectricVehiclesPipe } from 'src/electric-vehicles/pipes';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { PreAuthenticate } from '../app/securities';
import { ValidateAndSnapshotUsageProfilePipe } from './pipes';
import { CalculateActualUsageCostDto, CreateUtilityReqDto, GetActualUsageDto } from './req';
import {
  CostDataDto,
  LoadServingEntity,
  TariffDto,
  UtilityDataDto,
  UtilityDetailsDto,
  GetDataSeriesResDto,
} from './res';
import { UtilityService } from './utility.service';
import { IGetTypicalUsageKwh } from './sub-services';
import { TransformTypicalUsage } from './interceptors';
import {
  calculateElectricVehicle,
  calculatePlannedUsageIncreasesKwh,
  calculatePoolUsageKwh,
  mapToResult,
} from './operators';

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
  async getTariff(
    @Query('zipCode', ParseIntPipe) zipCode: number,
    @Query('lseId', ParseIntPipe) lseId: number,
  ): Promise<ServiceResponse<TariffDto>> {
    const res = await this.utilityService.getTariffs(zipCode, lseId);
    return ServiceResponse.fromResult(res);
  }

  @Get('/typical-usage-costs')
  @ApiOperation({ summary: 'Get Typical Usage Cost' })
  @ApiQuery({ name: 'zipCode', required: true })
  @ApiQuery({ name: 'masterTariffId', required: true })
  @ApiOkResponse({ type: CostDataDto })
  async calculateTypicalUsageCost(
    @Query('zipCode', ParseIntPipe) zipCode: number,
    @Query('masterTariffId') masterTariffId: string,
  ): Promise<ServiceResponse<CostDataDto>> {
    const res = await this.utilityService.calculateTypicalUsageCost(zipCode, masterTariffId);
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
  async createUtility(
    @Body(ValidateAndSnapshotUsageProfilePipe, ValidateAndSnapshotElectricVehiclesPipe) utility: CreateUtilityReqDto,
  ): Promise<ServiceResponse<UtilityDetailsDto>> {
    const res = await this.utilityService.createUtilityUsageDetail(utility);
    return ServiceResponse.fromResult(res);
  }

  @Put('/:utilityId')
  @ApiOperation({ summary: 'Update A Utility Usage Detail' })
  @ApiOkResponse({ type: UtilityDetailsDto })
  @CheckOpportunity()
  async updateUtility(
    @Param('utilityId', ParseObjectIdPipe) utilityId: ObjectId,
    @Body(ValidateAndSnapshotUsageProfilePipe, ValidateAndSnapshotElectricVehiclesPipe) utilityDto: CreateUtilityReqDto,
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

  @Get('/:opportunityId/data-series')
  @TransformTypicalUsage(
    calculatePlannedUsageIncreasesKwh,
    calculatePoolUsageKwh,
    calculateElectricVehicle,
    mapToResult(GetDataSeriesResDto),
  )
  @ApiOperation({ summary: 'Get utility data for rendering' })
  @ApiOkResponse({ type: GetDataSeriesResDto })
  getRenderDataSeries(@Param('opportunityId') opportunityId: string): Observable<IGetTypicalUsageKwh> {
    return this.utilityService.getTypicalUsage$(opportunityId);
  }
}

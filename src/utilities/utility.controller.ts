import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { Observable } from 'rxjs';
import { ServiceResponse } from 'src/app/common';
import { CheckOpportunity } from 'src/app/opportunity.pipe';
import { ValidateAndSnapshotElectricVehiclesPipe } from 'src/electric-vehicles/pipes';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { UseAsyncContext } from 'src/shared/async-context/decorators';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { PreAuthenticate } from '../app/securities';
import { TransformTypicalUsage } from './interceptors';
import {
  calculateElectricVehicle,
  calculatePlannedUsageIncreasesKwh,
  calculatePoolUsageKwh,
  mapToResult,
} from './operators';
import { ValidateAndSnapshotUsageProfilePipe } from './pipes';
import {
  CalculateActualUsageCostDto,
  CreateUtilityReqDto,
  GetPinballSimulatorAndCostPostInstallationDto,
  MedicalBaselineDataDto,
} from './req';
import {
  ComputedUsageDto,
  CostDataDto,
  GetDataSeriesResDto,
  LoadServingEntity,
  TariffDto,
  UtilityDataDto,
  UtilityDetailsDto,
} from './res';
import { PinballSimulatorDto, PinballSimulatorAndCostPostInstallationDto } from './res/pinball-simulator.dto';
import { IGetTypicalUsageKwh } from './sub-services';
import { UtilityService } from './utility.service';
import { UpdateAccPlusLowIncomeIncentiveDto } from './req/update-acc-plus-low-income-incentive.dto';

@ApiTags('Utilities')
@ApiBearerAuth()
@Controller('/utilities')
@PreAuthenticate()
export class UtilityController {
  constructor(
    private readonly utilityService: UtilityService,
    private readonly opportunityService: OpportunityService,
  ) {}

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
  async getTypicalBaseline(@Query('opportunityId') opportunityId: string): Promise<ServiceResponse<UtilityDataDto>> {
    const typicalBaselineParams = await this.opportunityService.getTypicalBaselineContactById(opportunityId);
    const res = await this.utilityService.getTypicalBaseline(typicalBaselineParams);
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
    @Query('opportunityId') opportunityId: string,
    @Query('masterTariffId') masterTariffId: string,
  ): Promise<ServiceResponse<CostDataDto>> {
    const res = await this.utilityService.calculateTypicalUsageCost(opportunityId, masterTariffId);
    return ServiceResponse.fromResult(res);
  }

  @Post('/actual-usage-costs')
  @ApiOperation({ summary: 'Get Actual Usage Cost' })
  @ApiOkResponse({ type: CostDataDto })
  async calculateActualUsageCost(@Body() data: CalculateActualUsageCostDto): Promise<ServiceResponse<CostDataDto>> {
    const res = await this.utilityService.calculateActualUsageCost(data);
    return ServiceResponse.fromResult(res);
  }

  @Put('/:utilityId/medical-baseline')
  @ApiOperation({ summary: 'Update Medical Baseline Information' })
  @ApiOkResponse({ type: UtilityDetailsDto })
  async updateMedicalBaseline(
    @Param('utilityId', ParseObjectIdPipe) utilityId: ObjectId,
    @Body() data: MedicalBaselineDataDto,
  ): Promise<ServiceResponse<UtilityDetailsDto>> {
    const res = await this.utilityService.updateMedicalBaseline(utilityId, data);
    return ServiceResponse.fromResult(res);
  }

  @Put('/:utilityId/acc-plus-low-income-incentive')
  @ApiOperation({ summary: 'Update ACC Plus Low Income Incentive' })
  @ApiOkResponse({ type: UtilityDetailsDto })
  async updateAccPlusLowIncomeIncentive(
    @Param('utilityId', ParseObjectIdPipe) utilityId: ObjectId,
    @Body() data: UpdateAccPlusLowIncomeIncentiveDto,
  ): Promise<ServiceResponse<UtilityDetailsDto>> {
    const res = await this.utilityService.updateAccPlusLowIncomeIncentive(utilityId, data);
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

  @Post('/pinball-simulator-and-cost-post-installation')
  @ApiOperation({ summary: 'Post-Install Battery Level And Net Load (PINBALL) Simulator' })
  @ApiOkResponse({ type: PinballSimulatorDto })
  async pinballSimulatorAndCostPostInstallation(
    @Body() data: GetPinballSimulatorAndCostPostInstallationDto,
  ): Promise<ServiceResponse<PinballSimulatorAndCostPostInstallationDto>> {
    const res = await this.utilityService.pinballSimulatorAndCostPostInstallation(data);
    return ServiceResponse.fromResult(res);
  }

  @UseAsyncContext
  @Get('/:opportunityId/existing-system-production')
  @ApiOperation({ summary: 'Get existing system production data' })
  @ApiOkResponse({ type: ComputedUsageDto })
  async getExisingSystemProduction(
    @Param('opportunityId') opportunityId: string,
  ): Promise<ServiceResponse<ComputedUsageDto>> {
    const res = await this.utilityService.getExistingSystemProduction(opportunityId);
    return ServiceResponse.fromResult(res);
  }
}

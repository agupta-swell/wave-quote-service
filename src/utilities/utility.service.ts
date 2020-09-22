import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { groupBy, sumBy } from 'lodash';
import { Model } from 'mongoose';
import { ExternalService } from '../external-services/external-service.service';
import { OperationResult } from './../app/common';
import { INTERVAL_VALUE } from './constants';
import { CalculateActualUsageCostDto } from './req/calculate-actual-usage-cost.dto';
import { UpdateUsageDto } from './req/update-usage';
import { TariffDto, UtilityDto } from './res';
import { CostData } from './res/cost-data.dto';
import {
  GenabilityTypicalBaseLineModel,
  GenabilityUsageData,
  GENABILITY_USAGE_DATA,
  ICostData,
  IUtilityCostData,
  UtilityUsageDetails,
  UtilityUsageDetailsModel,
  UTILITY_USAGE_DETAILS,
} from './utility.schema';

@Injectable()
export class UtilityService {
  constructor(
    @InjectModel(GENABILITY_USAGE_DATA)
    private readonly genabilityUsageDataModel: Model<GenabilityUsageData>,
    @InjectModel(UTILITY_USAGE_DETAILS)
    private readonly utilityUsageDetailsModel: Model<UtilityUsageDetails>,
    private readonly externalService: ExternalService,
  ) {}

  async getUtilityDetails(zipCode: number): Promise<OperationResult<UtilityDto>> {
    const loadServingEntityData = await this.externalService.getLoadServingEntity(zipCode);
    const data = { loadServingEntityData };
    return OperationResult.ok(new UtilityDto(data));
  }

  async getTypicalBaseline(zipCode: number): Promise<OperationResult<UtilityDto>> {
    const typicalBaseLine = await this.genabilityUsageDataModel.findOne({ zip_code: zipCode });
    if (typicalBaseLine) {
      const typicalBaseLineObj = typicalBaseLine.toObject();
      delete typicalBaseLineObj.typical_hourly_usage;
      const data = { typicalBaselineUsage: typicalBaseLineObj };
      return OperationResult.ok(new UtilityDto(data));
    }

    const typicalBaseLineAPI = await this.externalService.getTypicalBaseLine(zipCode);
    const genabilityTypicalBaseLine = {
      zip_code: typicalBaseLineAPI.zipCode,
      lse_id: typicalBaseLineAPI.lseId,
      typical_baseline: new GenabilityTypicalBaseLineModel(typicalBaseLineAPI),
      baseline_cost: '',
    };

    const createdTypicalBaseLine = new this.genabilityUsageDataModel(genabilityTypicalBaseLine);
    await createdTypicalBaseLine.save();

    const createdTypicalBaseLineObj = createdTypicalBaseLine.toObject();
    delete createdTypicalBaseLineObj.typical_baseline.typical_hourly_usage;
    const data = { typicalBaselineUsage: createdTypicalBaseLineObj };
    return OperationResult.ok(new UtilityDto(data));
  }

  async updateUsage(usage: UpdateUsageDto): Promise<boolean> {
    const utilityUsageDetailsModel = new UtilityUsageDetailsModel(usage);
    const model = new this.utilityUsageDetailsModel(utilityUsageDetailsModel);
    await model.save();

    return true;
  }

  async getTariffs(zipCode: number, lseId: number): Promise<OperationResult<TariffDto[]>> {
    const data = await this.externalService.getTariff(zipCode);
    const result = data.filter((item: any) => item.lseId === lseId);
    return OperationResult.ok(result.map(item => new TariffDto({ ...item, zipCode })));
  }

  async calculateTypicalUsageCost(zipCode: number, masterTariffId: string): Promise<OperationResult<CostData>> {
    const typicalBaseLine = await this.getTypicalBaselineData(zipCode);

    const monthlyCost = await this.calculateCost(
      typicalBaseLine.typical_baseline.typical_hourly_usage.map(item => item.v),
      masterTariffId,
    );

    const costData = {
      master_tariff_id: masterTariffId,
      typical_usage_cost: monthlyCost,
      actual_usage_cost: null,
    } as ICostData;

    return OperationResult.ok(new CostData(costData));
  }

  async calculateActualUsageCost(data: CalculateActualUsageCostDto): Promise<OperationResult<any>> {
    const { zipCode, masterTariffId, utilityData } = data;
    const typicalBaseLine = await this.getTypicalBaselineData(zipCode);

    const deltaValues = {} as { i: number };

    utilityData.actualUsage.monthlyUsage.map((monthly, index) => {
      const typicalUsageValue = utilityData.typicalBaselineUsage.typicalMonthlyUsage[index].v;
      const actualUsageValue = monthly.v;
      deltaValues[monthly.i] = (actualUsageValue - typicalUsageValue) / typicalUsageValue;
    });

    let i = 0;
    const { typical_hourly_usage = [] } = typicalBaseLine.typical_baseline;
    const len = typical_hourly_usage.length;
    while (i < len) {
      typical_hourly_usage[i].v = (deltaValues[this.getMonth(i)] + 1) * typical_hourly_usage[i].v;
      i++;
    }

    const monthlyCost = await this.calculateCost(
      typical_hourly_usage.map(item => item.v),
      masterTariffId,
    );

    
    const costData = {
      master_tariff_id: masterTariffId,
      typical_usage_cost: null,
      actual_usage_cost: monthlyCost,
    } as ICostData;

    return OperationResult.ok(new CostData(costData));
  }

  // -->>>>>>>>> INTERNAL <<<<<<<<<----

  getMonth(hour: number) {
    if (hour <= 744) return 1;
    if (hour <= 1416) return 2;
    if (hour <= 2160) return 3;
    if (hour <= 2880) return 4;
    if (hour <= 3624) return 5;
    if (hour <= 4344) return 6;
    if (hour <= 5088) return 7;
    if (hour <= 5832) return 8;
    if (hour <= 6552) return 9;
    if (hour <= 7296) return 10;
    if (hour <= 8016) return 11;
    if (hour <= 8760) return 12;
  }

  getLastDay(month: number, year: number) {
    return new Date(year, month, 0).getDate();
  }

  async getTypicalBaselineData(zipCode: number) {
    let typicalBaseLine = await this.genabilityUsageDataModel.findOne({ zip_code: zipCode });
    if (typicalBaseLine) {
      const typicalBaseLineObj = typicalBaseLine.toObject();
      return typicalBaseLineObj;
    }

    const typicalBaseLineAPI = await this.externalService.getTypicalBaseLine(zipCode);
    const genabilityTypicalBaseLine = {
      zip_code: typicalBaseLineAPI.zipCode,
      lse_id: typicalBaseLineAPI.lseId,
      typical_baseline: new GenabilityTypicalBaseLineModel(typicalBaseLineAPI),
      baseline_cost: '',
    };

    typicalBaseLine = new this.genabilityUsageDataModel(genabilityTypicalBaseLine);
    await typicalBaseLine.save();
    return typicalBaseLine.toObject();
  }

  async calculateCost(hourlyDataForTheYear: number[], masterTariffId: string): Promise<IUtilityCostData> {
    const data = await this.externalService.calculateCost(hourlyDataForTheYear, masterTariffId);
    const groupByMonth = groupBy(data[0].items, item => item.fromDateTime.substring(0, 7));
    const monthlyCosts = Object.keys(groupByMonth).reduce((acc, item) => {
      const [year, month] = item.split('-');
      const lastDay = this.getLastDay(Number(month), Number(year));
      const data = {
        start_date: `1/${month}/${year}`,
        end_date: `${lastDay}/${month}/${year}`,
        i: Number(month),
        v: sumBy(groupByMonth[item], 'cost'),
      };
      return [...acc, data];
    }, []);

    const costData = {
      start_date: new Date('2019-01-01'),
      end_date: new Date('2020-01-01'),
      interval: INTERVAL_VALUE.MONTH,
      cost: monthlyCosts,
    } as IUtilityCostData;

    return costData;
  }

  async getUtilityByOpportunityId(opportunityId: string): Promise<UtilityDto> {
    const utility = await this.utilityUsageDetailsModel.findOne({ opportunity_id: opportunityId });
    return utility ? new UtilityDto(utility) : null;
  }
}
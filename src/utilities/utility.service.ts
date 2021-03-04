import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { groupBy, sumBy } from 'lodash';
import { Model } from 'mongoose';
import { QuoteService } from 'src/quotes/quote.service';
import { ApplicationException } from '../app/app.exception';
import { OperationResult } from '../app/common';
import { ExternalService } from '../external-services/external-service.service';
import { SystemDesignService } from '../system-designs/system-design.service';
import { CALCULATION_MODE, INTERVAL_VALUE } from './constants';
import { CalculateActualUsageCostDto, GetActualUsageDto } from './req';
import { CreateUtilityDto } from './req/create-utility.dto';
import { CostDataDto, LoadServingEntity, TariffDto, UtilityDataDto } from './res';
import { UtilityDetailsDto } from './res/utility-details.dto';
import { UTILITIES, Utilities } from './schemas';
import {
  GenabilityCostData,
  GenabilityTypicalBaseLineModel,
  GenabilityUsageData,
  GENABILITY_COST_DATA,
  GENABILITY_USAGE_DATA,
  ICostData,
  ITypicalUsage,
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
    @InjectModel(UTILITIES)
    private readonly utilitiesModel: Model<Utilities>,
    @InjectModel(GENABILITY_COST_DATA)
    private readonly genabilityCostDataModel: Model<GenabilityCostData>,
    @InjectModel(UTILITY_USAGE_DETAILS)
    private readonly utilityUsageDetailsModel: Model<UtilityUsageDetails>,
    private readonly externalService: ExternalService,
    @Inject(forwardRef(() => SystemDesignService))
    private readonly systemDesignService: SystemDesignService,
    @Inject(forwardRef(() => QuoteService))
    private readonly quoteService: QuoteService,
  ) {}

  async getLoadServingEntities(zipCode: number): Promise<OperationResult<LoadServingEntity[]>> {
    const lseList = await this.externalService.getLoadServingEntities(zipCode);
    // console.log(lseList)
    return OperationResult.ok(lseList);
  }

  async getTypicalBaseline(zipCode: number, isInternal = false): Promise<OperationResult<UtilityDataDto>> {
    const typicalBaseLine = await this.genabilityUsageDataModel.findOne({ zip_code: zipCode });
    if (typicalBaseLine) {
      const typicalBaseLineObj = typicalBaseLine.toObject();
      if (!isInternal) {
        delete typicalBaseLineObj.typical_hourly_usage;
      }

      const data = { typicalBaselineUsage: typicalBaseLineObj };
      return OperationResult.ok(new UtilityDataDto(data, isInternal));
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
    if (!isInternal) {
      delete createdTypicalBaseLineObj.typical_baseline.typical_hourly_usage;
    }
    const data = { typicalBaselineUsage: createdTypicalBaseLineObj };
    return OperationResult.ok(new UtilityDataDto(data, isInternal));
  }

  async getTariffs(zipCode: number, lseId: number): Promise<OperationResult<TariffDto>> {
    const data = await this.externalService.getTariff(zipCode, lseId);
    const result = data.filter((item: any) => item.lseId === lseId);
    if (!result[0]) {
      throw ApplicationException.UnprocessableEnity(`No Tariff with zipCode: ${zipCode} and lseId: ${lseId}`);
    }
    const newResult = {
      zipCode: result[0].zipCode,
      lseId: result[0].lseId,
      lseName: result[0].name,
      tariffDetails: result.map(item => ({
        tariffCode: item.tariffCode,
        masterTariffId: item.masterTariffId,
        tariffName: item.tariffName,
      })),
    };
    return OperationResult.ok(new TariffDto({ ...newResult, zipCode }));
  }

  async calculateTypicalUsageCost(zipCode: number, masterTariffId: string): Promise<OperationResult<CostDataDto>> {
    const typicalBaseLine = await this.getTypicalBaselineData(zipCode);

    const monthlyCost = await this.calculateCost(
      typicalBaseLine.typical_baseline.typical_hourly_usage.map(item => item.v),
      masterTariffId,
      CALCULATION_MODE.TYPICAL,
      new Date().getFullYear(),
    );

    const costData = {
      master_tariff_id: masterTariffId,
      typical_usage_cost: monthlyCost,
      actual_usage_cost: null as any,
    } as ICostData;

    return OperationResult.ok(new CostDataDto(costData));
  }

  async calculateActualUsageCost(data: CalculateActualUsageCostDto): Promise<OperationResult<CostDataDto>> {
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
      // eslint-disable-next-line operator-assignment
      typical_hourly_usage[i].v = (deltaValues[this.getMonth(i)] + 1) * typical_hourly_usage[i].v;
      i += 1;
    }

    const monthlyCost = await this.calculateCost(
      typical_hourly_usage.map(item => item.v),
      masterTariffId,
      CALCULATION_MODE.ACTUAL,
      new Date().getFullYear(),
    );

    const costData = {
      master_tariff_id: masterTariffId,
      typical_usage_cost: null as any,
      actual_usage_cost: monthlyCost,
    } as ICostData;

    return OperationResult.ok(new CostDataDto(costData));
  }

  async createActualUsages(data: GetActualUsageDto): Promise<OperationResult<UtilityDataDto>> {
    const { costData, utilityData } = data;

    costData.actualUsageCost.cost.map((costDetail, index) => {
      const deltaValueFactor =
        (costDetail.v - costData.typicalUsageCost.cost[index].v) / costData.typicalUsageCost.cost[index].v;
      utilityData.actualUsage.monthlyUsage[index].v =
        utilityData.typicalBaselineUsage.typicalMonthlyUsage[index].v * (1 + deltaValueFactor);
    });
    return OperationResult.ok(UtilityDataDto.actualUsages(utilityData));
  }

  async createUtilityUsageDetail(utilityDto: CreateUtilityDto): Promise<OperationResult<UtilityDetailsDto>> {
    const found = await this.utilityUsageDetailsModel.findOne({ opportunity_id: utilityDto.opportunityId });
    if (found) {
      const createdUtilityObj = found.toObject();
      delete createdUtilityObj.utility_data.typical_baseline_usage._id;
      return OperationResult.ok(new UtilityDetailsDto(createdUtilityObj));
    }

    const typicalBaseLine = await this.getTypicalBaselineData(utilityDto.utilityData.typicalBaselineUsage.zipCode);
    const { typical_hourly_usage = [] } = typicalBaseLine.typical_baseline;

    const hourlyUsage = this.getHourlyUsageFromMonthlyUsage(utilityDto, typical_hourly_usage);
    const utilityModel = new UtilityUsageDetailsModel(utilityDto);
    utilityModel.setActualHourlyUsage(hourlyUsage);

    const createdUtility = new this.utilityUsageDetailsModel(utilityModel);
    await createdUtility.save();
    const createdUtilityObj = createdUtility.toObject();
    delete createdUtilityObj.utility_data.typical_baseline_usage._id;
    return OperationResult.ok(new UtilityDetailsDto(createdUtilityObj));
  }

  async getUtilityUsageDetail(opportunityId: string): Promise<OperationResult<UtilityDetailsDto>> {
    const res = await this.utilityUsageDetailsModel.findOne({ opportunity_id: opportunityId });
    if (!res) {
      return OperationResult.ok(null as any);
    }
    const obj = res.toObject();
    delete obj.utility_data.typical_baseline_usage._id;
    return OperationResult.ok(new UtilityDetailsDto(obj));
  }

  async updateUtilityUsageDetail(
    utilityId: string,
    utilityDto: CreateUtilityDto,
  ): Promise<OperationResult<UtilityDetailsDto>> {
    const typicalBaseLine = await this.getTypicalBaselineData(utilityDto.utilityData.typicalBaselineUsage.zipCode);
    const { typical_hourly_usage = [] } = typicalBaseLine.typical_baseline;

    const hourlyUsage = this.getHourlyUsageFromMonthlyUsage(utilityDto, typical_hourly_usage);
    const utilityModel = new UtilityUsageDetailsModel(utilityDto);
    utilityModel.setActualHourlyUsage(hourlyUsage);

    const updatedUtility = await this.utilityUsageDetailsModel.findByIdAndUpdate(utilityId, utilityModel, {
      new: true,
    });

    const [isUpdated] = await Promise.all([
      this.systemDesignService.updateListSystemDesign(
        utilityDto.opportunityId,
        utilityDto.utilityData.actualUsage.annualConsumption,
      ),
      this.quoteService.setOutdatedData(utilityDto.opportunityId, 'Utility and Usage'),
    ]);

    if (!isUpdated) {
      throw ApplicationException.SyncSystemDesignFail(utilityDto.opportunityId);
    }

    const updatedUtilityObj = updatedUtility?.toObject();
    delete updatedUtilityObj.utility_data.typical_baseline_usage._id;

    return OperationResult.ok(new UtilityDetailsDto(updatedUtilityObj));
  }

  // -->>>>>>>>>>>>>>>>>>>>>> INTERNAL <<<<<<<<<<<<<<<<<<<<<----

  getMonth(hour: number): number {
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
    return -1;
  }

  getLastDay(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
  }

  async getTypicalBaselineData(zipCode: number): Promise<GenabilityUsageData> {
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

  async calculateCost(
    hourlyDataForTheYear: number[],
    masterTariffId: string,
    mode: CALCULATION_MODE,
    year?: number,
    zipCode?: number,
  ): Promise<IUtilityCostData> {
    if (mode === CALCULATION_MODE.TYPICAL) {
      const genabilityCost = await this.genabilityCostDataModel.findOne({ master_tariff_id: masterTariffId });

      if (genabilityCost) {
        return genabilityCost.toObject().utility_cost;
      }
    }

    const data = await this.externalService.calculateCost(hourlyDataForTheYear, masterTariffId);
    const groupByMonth = groupBy(data[0].items, item => item.fromDateTime.substring(0, 7));
    const monthlyCosts = Object.keys(groupByMonth).reduce((acc, item) => {
      const [year, month] = item.split('-');
      const lastDay = this.getLastDay(Number(month), Number(year));
      const data = {
        start_date: new Date(`${month}/1/${year}`),
        end_date: new Date(`${month}/${lastDay}/${year}`),
        i: Number(month),
        v: sumBy(groupByMonth[item], 'cost'),
      };
      return [...acc, data];
    }, []);

    const currentYear = new Date().getFullYear();

    const costData = {
      start_date: new Date(`${currentYear - 1}-01-01`),
      end_date: new Date(`${currentYear}-01-01`),
      interval: INTERVAL_VALUE.MONTH,
      cost: monthlyCosts,
    } as IUtilityCostData;

    if (mode === CALCULATION_MODE.TYPICAL) {
      const genabilityCostData = {
        zip_code: zipCode,
        master_tariff_id: masterTariffId,
        utility_cost: costData,
      };

      const createdgenabilityCost = new this.genabilityCostDataModel(genabilityCostData);
      await createdgenabilityCost.save();
    }

    return costData;
  }

  async getUtilityByOpportunityId(opportunityId: string): Promise<UtilityUsageDetails | null> {
    const utility = await this.utilityUsageDetailsModel.findOne({ opportunity_id: opportunityId });
    return utility;
  }

  async countByOpportunityId(opportunityId: string): Promise<number> {
    const counter = await this.utilityUsageDetailsModel.countDocuments({ opportunity_id: opportunityId });
    return counter;
  }

  getHourlyUsageFromMonthlyUsage(utilityDto: CreateUtilityDto, typicalHourlyUsage: ITypicalUsage[]): ITypicalUsage[] {
    const deltaValue: any[] = [];
    const hourlyUsage: any[] = [];

    const condition = {
      1: 744,
      2: 1416,
      3: 2160,
      4: 2880,
      5: 3624,
      6: 4344,
      7: 5088,
      8: 5832,
      9: 6552,
      10: 7296,
      11: 8016,
      12: 8760,
    };

    utilityDto.utilityData.actualUsage.monthlyUsage.forEach((item, index) => {
      const typicalUsageValue = utilityDto.utilityData.typicalBaselineUsage.typicalMonthlyUsage[index].v;
      const actualUsageValue = item.v;
      deltaValue[index] = (actualUsageValue - typicalUsageValue) / typicalUsageValue;
    });

    let i = 0;
    let month = 0;
    while (i < typicalHourlyUsage.length) {
      hourlyUsage.push({ i: i + 1, v: typicalHourlyUsage[i].v * (1 + deltaValue[month]) });
      if (typicalHourlyUsage[i].i === condition[month]) {
        month += 1;
      }
      i += 1;
    }
    return hourlyUsage;
  }

  async getUtilityName(utilityId: string): Promise<string> {
    const utility = await this.utilitiesModel.findById(utilityId);
    return utility?.name || '';
  }

  // async getAllUtilities(): Promise<Utilities[]> {
  //   const utilities = await this.utilitiesModel.find();
  //   return utilities?.map(item => item.toObject({ versionKey: false }));
  // }
}

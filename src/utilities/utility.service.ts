import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { groupBy, sumBy } from 'lodash';
import { LeanDocument, Model } from 'mongoose';
import { QuoteService } from 'src/quotes/quote.service';
import { ApplicationException } from '../app/app.exception';
import { OperationResult } from '../app/common';
import { ExternalService } from '../external-services/external-service.service';
import { SystemDesignService } from '../system-designs/system-design.service';
import { CALCULATION_MODE, INTERVAL_VALUE } from './constants';
import { CalculateActualUsageCostDto, CreateUtilityDto, GetActualUsageDto } from './req';
import { CostDataDto, LoadServingEntity, TariffDetailDto, TariffDto, UtilityDataDto, UtilityDetailsDto } from './res';
import { UTILITIES, Utilities } from './schemas';
import { GenebilityLseData, GENEBILITY_LSE_DATA } from './schemas/genebility-lse-caching.schema';
import { GenebilityTeriffData, GENEBILITY_TARIFF_DATA } from './schemas/genebility-tariff-caching.schema';
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
  private GENEBILITY_CACHING_TIME = 24 * 60 * 60 * 1000;

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
    @InjectModel(GENEBILITY_LSE_DATA) private readonly genebilityLseDataModel: Model<GenebilityLseData>,
    @InjectModel(GENEBILITY_TARIFF_DATA) private readonly genebilityTeriffDataModel: Model<GenebilityTeriffData>,
  ) {}

  async getLoadServingEntities(zipCode: number): Promise<OperationResult<LoadServingEntity[]>> {
    const cacheData = await this.genebilityLseDataModel.findOne({ zip_code: zipCode }).lean();

    if (cacheData) {
      const expiredAt = +new Date((<any>cacheData).created_at) + this.GENEBILITY_CACHING_TIME;
      const now = +new Date();

      const remain = expiredAt - now;

      if (remain > 0)
        return OperationResult.ok(
          cacheData.data.map(({ lse_code, lse_id, lse_name, service_type }) => ({
            zipCode,
            lseName: lse_name,
            lseCode: lse_code,
            serviceType: service_type,
            lseId: lse_id,
          })),
        );

      await this.genebilityLseDataModel.deleteOne({ zip_code: zipCode });
    }

    const lseList = await this.externalService.getLoadServingEntities(zipCode);

    const data = {
      zip_code: zipCode,
      data: lseList.map(({ zipCode, lseName, lseCode, serviceType, lseId }) => ({
        zip_code: zipCode,
        lse_name: lseName,
        lse_code: lseCode,
        service_type: serviceType,
        lse_id: lseId,
      })),
    };

    await this.genebilityLseDataModel.create(data);
    return OperationResult.ok(lseList);
  }

  async getTypicalBaseline(zipCode: number, isInternal = false): Promise<OperationResult<UtilityDataDto>> {
    const typicalBaseLine = await this.genabilityUsageDataModel.findOne({ zip_code: zipCode }).lean();
    if (typicalBaseLine) {
      if (!isInternal) {
        // @ts-ignore
        delete typicalBaseLine?.typical_baseline?.typical_hourly_usage;
      }

      const data = { typicalBaselineUsage: typicalBaseLine };
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
      // @ts-ignore
      delete createdTypicalBaseLineObj?.typical_baseline?.typical_hourly_usage;
    }
    const data = { typicalBaselineUsage: createdTypicalBaseLineObj };
    return OperationResult.ok(new UtilityDataDto(data, isInternal));
  }

  async getTariffs(zipCode: number, lseId: number): Promise<OperationResult<TariffDto>> {
    const cacheData = await this.genebilityTeriffDataModel
      .findOne({
        zip_code: zipCode,
        lse_id: `${lseId}`,
      })
      .lean();

    if (cacheData) {
      const expiredAt = +new Date((<any>cacheData).created_at) + this.GENEBILITY_CACHING_TIME;
      const now = +new Date();

      const remain = expiredAt - now;

      if (remain > 0) {
        return OperationResult.ok(
          new TariffDto({
            zipCode,
            lseId: `${lseId}`,
            lseName: cacheData.lse_name,
            tariffDetails: cacheData.tariff_details.map(
              ({ master_tariff_id, tariff_code, tariff_name }) =>
                new TariffDetailDto({
                  tariffCode: tariff_code,
                  tariffName: tariff_name,
                  masterTariffId: master_tariff_id,
                }),
            ),
          }),
        );
      }

      await this.genebilityTeriffDataModel.deleteOne({
        zip_code: zipCode,
        lse_id: `${lseId}`,
      });
    }

    const data = await this.externalService.getTariff(zipCode, lseId);
    const result = data.filter((item: any) => item.lseId === lseId);

    if (!result[0]) {
      throw ApplicationException.UnprocessableEntity(`No Tariff with zipCode: ${zipCode} and lseId: ${lseId}`);
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

    const updateData: LeanDocument<GenebilityTeriffData> = {
      lse_id: newResult.lseId,
      lse_name: newResult.lseName,
      zip_code: newResult.zipCode,
      tariff_details: newResult.tariffDetails.map(({ tariffCode, masterTariffId, tariffName }) => ({
        tariff_code: tariffCode,
        master_tariff_id: masterTariffId,
        tariff_name: tariffName,
      })),
    };

    await this.genebilityTeriffDataModel.create({ ...updateData, zip_code: zipCode });

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
    const found = await this.utilityUsageDetailsModel.findOne({ opportunity_id: utilityDto.opportunityId }).lean();
    if (found) {
      delete found.utility_data.typical_baseline_usage._id;
      return OperationResult.ok(new UtilityDetailsDto(found));
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
    const res = await this.utilityUsageDetailsModel.findOne({ opportunity_id: opportunityId }).lean();
    if (!res) {
      return OperationResult.ok(null as any);
    }
    delete res.utility_data.typical_baseline_usage._id;
    return OperationResult.ok(new UtilityDetailsDto(res));
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

    const updatedUtility = await this.utilityUsageDetailsModel
      .findByIdAndUpdate(utilityId, utilityModel, {
        new: true,
      })
      .lean();

    const [isUpdated] = await Promise.all([
      this.systemDesignService.updateListSystemDesign(
        utilityDto.opportunityId,
        utilityDto.utilityData.actualUsage.annualConsumption,
      ),
      this.quoteService.setOutdatedData(utilityDto.opportunityId, 'Utility & Usage'),
    ]);

    if (!isUpdated) {
      throw ApplicationException.SyncSystemDesignFail(utilityDto.opportunityId);
    }

    delete updatedUtility?.utility_data?.typical_baseline_usage?._id;

    return OperationResult.ok(new UtilityDetailsDto(updatedUtility || ({} as any)));
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

  async getTypicalBaselineData(zipCode: number): Promise<LeanDocument<GenabilityUsageData>> {
    let typicalBaseLine: any = await this.genabilityUsageDataModel.findOne({ zip_code: zipCode }).lean();
    if (typicalBaseLine) {
      return typicalBaseLine;
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
      const genabilityCost = await this.genabilityCostDataModel.findOne({ master_tariff_id: masterTariffId }).lean();

      if (genabilityCost) {
        return genabilityCost.utility_cost;
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

  async getUtilityByOpportunityId(opportunityId: string): Promise<LeanDocument<UtilityUsageDetails> | null> {
    const utility = await this.utilityUsageDetailsModel.findOne({ opportunity_id: opportunityId }).lean();
    return utility;
  }

  async countByOpportunityId(opportunityId: string): Promise<number> {
    const counter = await this.utilityUsageDetailsModel.countDocuments({ opportunity_id: opportunityId }).lean();
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
    const utility = await this.utilitiesModel.findById(utilityId).lean();
    return utility?.name || '';
  }

  // async getAllUtilities(): Promise<Utilities[]> {
  //   const utilities = await this.utilitiesModel.find();
  //   return utilities?.map(item => item.toObject({ versionKey: false }));
  // }
}

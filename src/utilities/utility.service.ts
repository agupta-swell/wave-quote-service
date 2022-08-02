/* eslint-disable consistent-return */
import { forwardRef, Inject, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { groupBy, sumBy } from 'lodash';
import { LeanDocument, Model, ObjectId } from 'mongoose';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { QuoteService } from 'src/quotes/quote.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { IUsageProfile } from 'src/usage-profiles/interfaces';
import { UsageProfileService } from 'src/usage-profiles/usage-profile.service';
import * as dayjs from 'dayjs';
import * as dayOfYear from 'dayjs/plugin/dayOfYear';
import { ApplicationException } from '../app/app.exception';
import { OperationResult } from '../app/common';
import { ExternalService } from '../external-services/external-service.service';
import { SystemDesignService } from '../system-designs/system-design.service';
import { CALCULATION_MODE, ENTRY_MODE, INTERVAL_VALUE } from './constants';
import { CalculateActualUsageCostDto, CreateUtilityReqDto, GetActualUsageDto } from './req';
import { UsageValue } from './req/sub-dto';
import { CostDataDto, LoadServingEntity, TariffDto, UtilityDataDto, UtilityDetailsDto } from './res';
import { UTILITIES, Utilities } from './schemas';
import { GenebilityLseData, GENEBILITY_LSE_DATA } from './schemas/genebility-lse-caching.schema';
import { GenebilityTeriffData, GENEBILITY_TARIFF_DATA } from './schemas/genebility-tariff-caching.schema';
import { getTypicalUsage, IGetTypicalUsageKwh } from './sub-services';
import {
  GenabilityCostData,
  GenabilityTypicalBaseLineModel,
  GenabilityUsageData,
  GENABILITY_COST_DATA,
  GENABILITY_USAGE_DATA,
  IUsageValue,
  IUtilityCostData,
  UtilityUsageDetails,
  UtilityUsageDetailsModel,
  UTILITY_USAGE_DETAILS,
} from './utility.schema';
import BigNumber from 'bignumber.js';

@Injectable()
export class UtilityService implements OnModuleInit {
  private GENEBILITY_CACHING_TIME = 24 * 60 * 60 * 1000;

  private readonly logger = new Logger(UtilityService.name);

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
    private readonly usageProfileService: UsageProfileService,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('Ensure v2_genability_usage_data.zip_code index');
      await this.ensureGenabilityUsageDataIndex();
      this.logger.log('Done v2_genability_usage_data.zip_code index');
    } catch (err) {
      this.logger.error(err);
    }
  }

  async getLoadServingEntities(zipCode: number): Promise<OperationResult<LoadServingEntity[]>> {
    const cacheData = await this.genebilityLseDataModel.findOne({ zipCode }).lean();

    if (cacheData) {
      const expiredAt = +new Date((<any>cacheData).createdAt) + this.GENEBILITY_CACHING_TIME;
      const now = +new Date();

      const remain = expiredAt - now;
      if (remain > 0)
        return OperationResult.ok(
          cacheData.data.map(({ lseName, lseCode, serviceType, lseId }) => ({
            zipCode,
            lseName,
            lseCode,
            serviceType,
            lseId,
          })),
        );

      await this.genebilityLseDataModel.deleteOne({ zipCode });
    }

    const lseList = await this.externalService.getLoadServingEntities(zipCode);

    await this.genebilityLseDataModel.create({
      zipCode,
      data: lseList,
    });

    return OperationResult.ok(lseList);
  }

  async getTypicalBaseline(zipCode: number, isInternal = false): Promise<OperationResult<UtilityDataDto>> {
    const typicalBaseLine = await this.genabilityUsageDataModel.findOne({ zipCode }).lean();
    if (typicalBaseLine) {
      if (
        typicalBaseLine.typicalBaseline.__v ||
        Math.round(typicalBaseLine.typicalBaseline.annualConsumption) !== 12000
      ) {
        if (!isInternal) {
          // @ts-ignore
          delete typicalBaseLine.typicalBaseline.typicalHourlyUsage;
        }

        const data = { typicalBaselineUsage: typicalBaseLine.typicalBaseline };
        return OperationResult.ok(strictPlainToClass(UtilityDataDto, data));
      }

      await this.genabilityUsageDataModel.deleteOne({ zipCode });
    }

    const typicalBaseLineAPI = await this.externalService.getTypicalBaseLine(zipCode);
    const genabilityTypicalBaseLine = {
      zipCode: typicalBaseLineAPI.zipCode,
      lseId: typicalBaseLineAPI.lseId,
      typicalBaseline: new GenabilityTypicalBaseLineModel(typicalBaseLineAPI),
      baselineCost: '',
    };

    const createdTypicalBaseLine = new this.genabilityUsageDataModel(genabilityTypicalBaseLine);

    await createdTypicalBaseLine.save();

    const createdTypicalBaseLineObj = createdTypicalBaseLine.toObject();
    if (!isInternal) {
      // @ts-ignore
      delete createdTypicalBaseLineObj?.typicalBaseline?.typicalHourlyUsage;
    }
    const data = { typicalBaselineUsage: createdTypicalBaseLineObj.typicalBaseline };
    return OperationResult.ok(strictPlainToClass(UtilityDataDto, data));
  }

  async getTariffs(zipCode: number, lseId?: number): Promise<OperationResult<TariffDto>> {
    const query = lseId
      ? {
          zipCode,
          lseId,
        }
      : { zipCode };
    const cacheData = await this.genebilityTeriffDataModel.findOne(<any>query).lean();

    if (cacheData) {
      const expiredAt = +new Date((<any>cacheData).createdAt) + this.GENEBILITY_CACHING_TIME;
      const now = +new Date();

      const remain = expiredAt - now;

      if (remain > 0) {
        return OperationResult.ok(
          strictPlainToClass(TariffDto, {
            zipCode,
            lseId,
            lseName: cacheData.lseName,
            tariffDetails: cacheData.tariffDetails,
          }),
        );
      }

      await this.genebilityTeriffDataModel.deleteOne({
        zipCode,
        lseId: `${lseId}`,
      });
    }

    const data = await this.externalService.getTariff(zipCode, lseId);
    const result = data.filter((item: any) => !lseId || item.lseId === lseId);

    if (!result[0]) {
      throw ApplicationException.UnprocessableEntity(`No Tariff with zipCode: ${zipCode} and lseId: ${lseId}`);
    }

    const newResult = {
      zipCode: result[0].zipCode || zipCode,
      lseId: lseId?.toString() || '',
      lseName: result[0].name,
      tariffDetails: result,
    };

    await this.genebilityTeriffDataModel.create(newResult);

    return OperationResult.ok(strictPlainToClass(TariffDto, newResult));
  }

  async calculateTypicalUsageCost(zipCode: number, masterTariffId: string): Promise<OperationResult<CostDataDto>> {
    const typicalBaseLine = await this.getTypicalBaselineData(zipCode);

    const monthlyCost = await this.calculateCost(
      typicalBaseLine.typicalBaseline.typicalHourlyUsage.map(item => item.v),
      masterTariffId,
      CALCULATION_MODE.TYPICAL,
      new Date().getFullYear(),
    );

    const costData = {
      masterTariffId,
      typicalUsageCost: monthlyCost,
      actualUsageCost: null as any,
    };

    return OperationResult.ok(strictPlainToClass(CostDataDto, costData));
  }

  async calculateActualUsageCost(data: CalculateActualUsageCostDto): Promise<OperationResult<CostDataDto>> {
    const { zipCode, masterTariffId, utilityData, usageProfileId } = data;
    let hourlyDataForTheYear: UsageValue[] = [];

    if (utilityData.computedUsage?.hourlyUsage?.length) {
      hourlyDataForTheYear = utilityData.computedUsage.hourlyUsage;
    } else {
      const typicalBaseLine = await this.getTypicalBaselineData(zipCode);
      const usageProfile = (usageProfileId && (await this.usageProfileService.getOne(usageProfileId))) || undefined;

      hourlyDataForTheYear = this.calculate8760LoadShapping(
        typicalBaseLine,
        utilityData.computedUsage.monthlyUsage,
        usageProfile,
      );
    }

    const monthlyCost = await this.calculateCost(
      hourlyDataForTheYear.map(item => item.v),
      masterTariffId,
      CALCULATION_MODE.ACTUAL,
      new Date().getFullYear(),
    );

    const costData = {
      masterTariffId,
      actualUsageCost: null as any,
      computedCost: monthlyCost,
    };

    return OperationResult.ok(strictPlainToClass(CostDataDto, costData));
  }

  async createActualUsages(data: GetActualUsageDto): Promise<OperationResult<UtilityDataDto>> {
    const { costData, utilityData } = data;

    costData.computedCost.cost.map((costDetail, index) => {
      const deltaValueFactor =
        (costDetail.v - costData.typicalUsageCost.cost[index].v) / costData.typicalUsageCost.cost[index].v;
      utilityData.computedUsage.monthlyUsage[index].v =
        utilityData.typicalBaselineUsage.typicalMonthlyUsage[index].v * (1 + deltaValueFactor);
    });

    utilityData.computedUsage.annualConsumption = utilityData.computedUsage.monthlyUsage.reduce((total, { v }) => {
      total += v;
      return total;
    }, 0);

    return OperationResult.ok(strictPlainToClass(UtilityDataDto, utilityData as any));
  }

  async createUtilityUsageDetail(utilityDto: CreateUtilityReqDto): Promise<OperationResult<UtilityDetailsDto>> {
    const found = await this.utilityUsageDetailsModel.findOne({ opportunityId: utilityDto.opportunityId }).lean();
    if (found) {
      delete found.utilityData.typicalBaselineUsage._id;
      return OperationResult.ok(strictPlainToClass(UtilityDetailsDto, found));
    }

    const typicalBaseLine = await this.getTypicalBaselineData(utilityDto.utilityData.typicalBaselineUsage.zipCode);
    const { typicalHourlyUsage = [], typicalMonthlyUsage } = typicalBaseLine.typicalBaseline;
    utilityDto.utilityData.typicalBaselineUsage.typicalHourlyUsage = typicalHourlyUsage;

    const utilityModel = new UtilityUsageDetailsModel(utilityDto);

    if (utilityDto.entryMode !== ENTRY_MODE.CSV_INTERVAL_DATA) {
      const computedHourlyUsage = this.getHourlyUsageFromMonthlyUsage(
        utilityDto.utilityData.computedUsage.monthlyUsage,
        typicalMonthlyUsage,
        typicalHourlyUsage,
      );
      utilityModel.setComputedHourlyUsage(computedHourlyUsage);
    }

    const createdUtility = new this.utilityUsageDetailsModel(utilityModel);

    await createdUtility.save();
    const createdUtilityObj = createdUtility.toObject();
    return OperationResult.ok(strictPlainToClass(UtilityDetailsDto, createdUtilityObj));
  }

  async getUtilityUsageDetail(opportunityId: string): Promise<OperationResult<UtilityDetailsDto>> {
    const res = await this.utilityUsageDetailsModel.findOne({ opportunityId }).lean();
    if (!res) {
      return OperationResult.ok(null as any);
    }

    delete res.utilityData.typicalBaselineUsage._id;
    return OperationResult.ok(strictPlainToClass(UtilityDetailsDto, res));
  }

  async updateUtilityUsageDetail(
    utilityId: ObjectId,
    utilityDto: CreateUtilityReqDto,
  ): Promise<OperationResult<UtilityDetailsDto>> {
    const typicalBaseLine = await this.getTypicalBaselineData(utilityDto.utilityData.typicalBaselineUsage.zipCode);
    const { typicalHourlyUsage = [], typicalMonthlyUsage } = typicalBaseLine.typicalBaseline;
    utilityDto.utilityData.typicalBaselineUsage.typicalHourlyUsage = typicalHourlyUsage;

    const utilityModel = new UtilityUsageDetailsModel(utilityDto);

    if (utilityDto.entryMode !== ENTRY_MODE.CSV_INTERVAL_DATA) {
      const hourlyUsage = this.getHourlyUsageFromMonthlyUsage(
        utilityDto.utilityData.computedUsage.monthlyUsage,
        typicalMonthlyUsage,
        typicalHourlyUsage,
      );
      utilityModel.setComputedHourlyUsage(hourlyUsage);
    }

    const updatedUtility = await this.utilityUsageDetailsModel
      .findOneAndUpdate({ _id: utilityId }, utilityModel, {
        new: true,
      })
      .lean();

    const [isUpdated] = await Promise.all([
      this.systemDesignService.updateListSystemDesign(
        utilityDto.opportunityId,
        utilityDto.utilityData.computedUsage.annualConsumption,
      ),
      this.quoteService.setOutdatedData(utilityDto.opportunityId, 'Utility & Usage'),
    ]);

    if (!isUpdated) {
      throw ApplicationException.SyncSystemDesignFail(utilityDto.opportunityId);
    }

    return OperationResult.ok(strictPlainToClass(UtilityDetailsDto, updatedUtility));
  }

  getTypicalUsage$(opportunityId: string): Observable<IGetTypicalUsageKwh> {
    const utility$ = from(this.getUtilityByOpportunityId(opportunityId));

    return utility$.pipe(
      map(v => {
        if (!v) {
          throw new NotFoundException(`Utility not found for opportunityId: ${opportunityId}`);
        }
        return getTypicalUsage(v);
      }),
    );
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
    let typicalBaseLine: any = await this.genabilityUsageDataModel.findOne({ zipCode }).lean();
    if (typicalBaseLine) {
      return typicalBaseLine;
    }

    const typicalBaseLineAPI = await this.externalService.getTypicalBaseLine(zipCode);
    const genabilityTypicalBaseLine = {
      zipCode: typicalBaseLineAPI.zipCode,
      lseId: typicalBaseLineAPI.lseId,
      typicalBaseline: new GenabilityTypicalBaseLineModel(typicalBaseLineAPI),
      baselineCost: '',
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
      const genabilityCost = await this.genabilityCostDataModel.findOne({ masterTariffId }).lean();

      if (genabilityCost) {
        return genabilityCost.utilityCost;
      }
    }

    const data = await this.externalService.calculateCost(hourlyDataForTheYear, masterTariffId);
    const groupByMonth = groupBy(data[0].items, item => item.fromDateTime.substring(0, 7));
    const monthlyCosts = Object.keys(groupByMonth).reduce((acc, item) => {
      const [year, month] = item.split('-');
      const lastDay = this.getLastDay(Number(month), Number(year));
      const data = {
        startDate: new Date(`${month}/1/${year}`),
        endDate: new Date(`${month}/${lastDay}/${year}`),
        i: Number(month),
        v: sumBy(groupByMonth[item], 'cost'),
      };
      return [...acc, data];
    }, []);

    const currentYear = new Date().getFullYear();

    const costData = {
      startDate: new Date(`${currentYear - 1}-01-01`),
      endDate: new Date(`${currentYear}-01-01`),
      interval: INTERVAL_VALUE.MONTH,
      cost: monthlyCosts,
    } as IUtilityCostData;

    if (mode === CALCULATION_MODE.TYPICAL) {
      const genabilityCostData = {
        zipCode,
        masterTariffId,
        utilityCost: costData,
      };

      const createdGenabilityCost = new this.genabilityCostDataModel(genabilityCostData);
      await createdGenabilityCost.save();
    }

    return costData;
  }

  async getUtilityByOpportunityId(opportunityId: string): Promise<LeanDocument<UtilityUsageDetails> | null> {
    const utility = await this.utilityUsageDetailsModel.findOne({ opportunityId }).lean();
    return utility;
  }

  async countByOpportunityId(opportunityId: string): Promise<number> {
    const counter = await this.utilityUsageDetailsModel.countDocuments({ opportunityId });
    return counter;
  }

  getHourlyUsageFromMonthlyUsage(
    monthlyUsage: UsageValue[],
    typicalMonthlyUsage: UsageValue[],
    typicalHourlyUsage: IUsageValue[],
  ): IUsageValue[] {
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

    monthlyUsage.forEach((item, index) => {
      const typicalUsageValue = typicalMonthlyUsage[index].v;
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

  async getUtilityDetailByName(utilityName: string): Promise<LeanDocument<Utilities> | null> {
    const utility = await this.utilitiesModel.findOne({ name: utilityName }).lean();
    return utility;
  }

  private async ensureGenabilityUsageDataIndex(): Promise<string> {
    return this.genabilityUsageDataModel.collection.createIndex({
      zip_code: 1,
    });
  }

  private calculate8760LoadShapping(
    typicalBaseLine: LeanDocument<GenabilityUsageData>,
    actualMonthlyUsage: UsageValue[],
    usageProfile?: IUsageProfile,
  ): IUsageValue[] {
    dayjs.extend(dayOfYear);

    const typical8760Usage = typicalBaseLine.typicalBaseline.typicalHourlyUsage;

    const typicalUsageByMonth = Array.from({ length: 12 }, () => 0);

    typical8760Usage.forEach(({ i: hourIndex, v }) => {
      const dayOfYear = dayjs().dayOfYear(Math.ceil(hourIndex / 24));
      const monthIndex = dayOfYear.get('month');
      typicalUsageByMonth[monthIndex] = new BigNumber(typicalUsageByMonth[monthIndex]).plus(v).toNumber();
    });

    const scalingFactorByMonth = typicalUsageByMonth.map((monthlyUsage, index) =>
      new BigNumber(actualMonthlyUsage[index].v).dividedBy(monthlyUsage).toNumber(),
    );

    const hourlyAllocationByMonth = Array.from({ length: 12 }, () => Array.from({ length: 24 }, () => 0));
    const targetMonthlyKwh = Array.from({ length: 12 }, () => 0);

    const scaledArray = typical8760Usage.map(({ i: hourIndex, v }) => {
      const dayOfYear = dayjs().dayOfYear(Math.floor(hourIndex / 24) + 1);
      const monthIndex = dayOfYear.get('month');

      const scaledValue = new BigNumber(v).multipliedBy(scalingFactorByMonth[monthIndex]).toNumber();

      hourlyAllocationByMonth[monthIndex][(hourIndex - 1) % 24] = new BigNumber(
        hourlyAllocationByMonth[monthIndex][(hourIndex - 1) % 24],
      )
        .plus(scaledValue)
        .toNumber();

      targetMonthlyKwh[monthIndex] = new BigNumber(targetMonthlyKwh[monthIndex]).plus(scaledValue).toNumber();

      return {
        i: hourIndex,
        v: scaledValue,
      };
    });

    if (!usageProfile) {
      return scaledArray;
    }

    const { seasons } = usageProfile;

    const flattenUsageProfile: number[][] = Array.from({ length: 12 });

    seasons.forEach(season => {
      season.applicableMonths.forEach(month => {
        flattenUsageProfile[month - 1] = season.hourlyAllocation;
      });
    });

    const scalingFactorForShaping = hourlyAllocationByMonth.map((hourlyAllocation, monthIndex) =>
      hourlyAllocation.map((hourValue, hourIndex) => {
        const proportion = new BigNumber(hourValue).dividedBy(targetMonthlyKwh[monthIndex]).toNumber();

        const usageProfileHourValue = flattenUsageProfile[monthIndex][hourIndex];

        return usageProfileHourValue ? new BigNumber(usageProfileHourValue).dividedBy(proportion).toNumber() : 0;
      }),
    );

    const shapedArray = scaledArray.map(({ i: hourIndex, v }) => {
      const dayOfYear = dayjs().dayOfYear(Math.floor(hourIndex / 24) + 1);
      const monthIndex = dayOfYear.get('month');

      return {
        i: hourIndex,
        v: new BigNumber(v)
          .multipliedBy(scalingFactorForShaping[monthIndex][(hourIndex - 1) % 24])
          .dividedBy(100)
          .toNumber(),
      };
    });

    return shapedArray;
  }
}

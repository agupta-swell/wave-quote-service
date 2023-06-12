/* eslint-disable no-plusplus */
/* eslint-disable consistent-return */
import { forwardRef, Inject, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import BigNumber from 'bignumber.js';
import * as dayjs from 'dayjs';
import * as dayOfYear from 'dayjs/plugin/dayOfYear';
import { inRange, mean, sum, sumBy, cloneDeep } from 'lodash';
import { LeanDocument, Model, ObjectId } from 'mongoose';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContactService } from 'src/contacts/contact.service';
import { ExistingSystemService } from 'src/existing-systems/existing-system.service';
import { EGenabilityDetailLevel, EGenabilityGroupBy } from 'src/external-services/typing';
import { OpportunityService } from 'src/opportunities/opportunity.service';
import { QuoteService } from 'src/quotes/quote.service';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { BATTERY_PURPOSE } from 'src/system-designs/constants';
import { SystemProductService } from 'src/system-designs/sub-services';
import { IUsageProfile } from 'src/usage-profiles/interfaces';
import { UsageProfileDocument } from 'src/usage-profiles/interfaces/usage-profile.interface';
import { UsageProfileService } from 'src/usage-profiles/usage-profile.service';
import { TypicalBaselineParamsDto } from 'src/utilities/req/sub-dto/typical-baseline-params.dto';
import { firstSundayOfTheMonth, getMonthDatesOfYear, getNextYearDateRange } from 'src/utils/datetime';
import { roundNumber } from 'src/utils/transformNumber';
import { ApplicationException } from '../app/app.exception';
import { OperationResult } from '../app/common';
import { ExternalService } from '../external-services/external-service.service';
import { SystemDesignService } from '../system-designs/system-design.service';
import { CALCULATION_MODE, CHARGING_LOGIC_TYPE, ENTRY_MODE, INTERVAL_VALUE } from './constants';
import { roundUpNumber } from './operators';
import {
  BatterySystemSpecsDto,
  CalculateActualUsageCostDto,
  CreateUtilityReqDto,
  GetPinballSimulatorAndCostPostInstallationDto,
  GetPinballSimulatorDto,
  MedicalBaselineDataDto,
} from './req';
import { UsageValue } from './req/sub-dto';
import {
  CostDataDto,
  ExistingSystemProductionDto,
  LoadServingEntity,
  TariffDto,
  UtilityDataDto,
  UtilityDetailsDto,
} from './res';
import { PinballSimulatorAndCostPostInstallationDto, PinballSimulatorDto } from './res/pinball-simulator.dto';
import { UTILITIES, Utilities } from './schemas';
import { GenabilityLseData, GENABILITY_LSE_DATA } from './schemas/genability-lse-caching.schema';
import { GenabilityTeriffData, GENABILITY_TARIFF_DATA } from './schemas/genability-tariff-caching.schema';
import { getTypicalUsage, IGetTypicalUsageKwh } from './sub-services';
import { IPinballRateAmount } from './utility.interface';
import {
  GenabilityCostData,
  GenabilityTypicalBaseLineModel,
  GenabilityUsageData,
  GENABILITY_COST_DATA,
  GENABILITY_USAGE_DATA,
  ICostDetailData,
  IMonthSeasonTariff,
  IUsageValue,
  IUtilityCostData,
  UtilityUsageDetails,
  UtilityUsageDetailsModel,
  UTILITY_USAGE_DETAILS,
} from './utility.schema';

@Injectable()
export class UtilityService implements OnModuleInit {
  private AWS_S3_UTILITY_DATA = process.env.AWS_S3_UTILITY_DATA as string;

  private GENABILITY_CACHING_TIME = 24 * 60 * 60 * 1000;

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
    @InjectModel(GENABILITY_LSE_DATA) private readonly genabilityLseDataModel: Model<GenabilityLseData>,
    @InjectModel(GENABILITY_TARIFF_DATA) private readonly genabilityTeriffDataModel: Model<GenabilityTeriffData>,
    private readonly usageProfileService: UsageProfileService,
    @Inject(forwardRef(() => ExistingSystemService))
    private readonly existingSystemService: ExistingSystemService,
    private readonly systemProductService: SystemProductService,
    @Inject(forwardRef(() => ContactService))
    private readonly contactService: ContactService,
    @Inject(forwardRef(() => OpportunityService))
    private readonly opportunityService: OpportunityService,
    private readonly s3Service: S3Service,
  ) {
    dayjs.extend(dayOfYear);
    if (!this.AWS_S3_UTILITY_DATA) {
      throw new Error('Missing AWS_S3_UTILITY_DATA');
    }
  }

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
    const cacheData = await this.genabilityLseDataModel.findOne({ zipCode }).lean();

    if (cacheData) {
      const expiredAt = +new Date((<any>cacheData).createdAt) + this.GENABILITY_CACHING_TIME;
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

      await this.genabilityLseDataModel.deleteOne({ zipCode });
    }

    const lseList = await this.externalService.getLoadServingEntities(zipCode);

    await this.genabilityLseDataModel.create({
      zipCode,
      data: lseList,
    });

    return OperationResult.ok(lseList);
  }

  async getTypicalBaseline(
    typicalBaselineParams: TypicalBaselineParamsDto,
    isInternal = false,
  ): Promise<OperationResult<UtilityDataDto>> {
    const typicalBaseLine = await this.genabilityUsageDataModel
      .findOne({ zipCode: typicalBaselineParams.zipCode })
      .lean();
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

      await this.genabilityUsageDataModel.deleteOne({ zipCode: typicalBaselineParams.zipCode });
    }

    const typicalBaseLineAPI = await this.externalService.getTypicalBaseLine(typicalBaselineParams);
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
    const cacheData = await this.genabilityTeriffDataModel.findOne(<any>query).lean();

    if (cacheData) {
      const expiredAt = +new Date((<any>cacheData).createdAt) + this.GENABILITY_CACHING_TIME;
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

      await this.genabilityTeriffDataModel.deleteOne({
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

    await this.genabilityTeriffDataModel.create(newResult);

    return OperationResult.ok(strictPlainToClass(TariffDto, newResult));
  }

  async calculateTypicalUsageCost(
    opportunityId: string,
    masterTariffId: string,
  ): Promise<OperationResult<CostDataDto>> {
    const [typicalBaseLine, utilityUsageDetailData] = await Promise.all([
      this.getTypicalBaselineData(opportunityId),
      this.utilityUsageDetailsModel.findOne({ opportunityId }).lean(),
    ]);
    const medicalBaselineAmount = utilityUsageDetailData?.medicalBaselineAmount;

    const usageCost = await this.calculateCost(
      typicalBaseLine.typicalBaseline.typicalHourlyUsage.map(item => item.v),
      masterTariffId,
      CALCULATION_MODE.TYPICAL,
      typicalBaseLine.zipCode,
      medicalBaselineAmount,
      new Date().getFullYear(),
    );

    const costData = {
      masterTariffId,
      typicalUsageCost: usageCost,
      actualUsageCost: null as any,
    };

    return OperationResult.ok(strictPlainToClass(CostDataDto, costData));
  }

  async calculateActualUsageCostUtil(data: CalculateActualUsageCostDto): Promise<any> {
    const { masterTariffId, utilityData, usageProfileId, opportunityId, medicalBaselineAmount } = data;
    const utilityUsageDetailData = await this.utilityUsageDetailsModel.findOne({ opportunityId }).lean();

    let hourlyDataForTheYear: UsageValue[] = [];

    if (utilityData.computedUsage?.hourlyUsage?.length) {
      hourlyDataForTheYear = utilityData.computedUsage.hourlyUsage;
    } else {
      const handlers: Promise<unknown>[] = [this.getTypicalBaselineData(data.opportunityId)];
      if (usageProfileId) handlers.push(this.usageProfileService.getOne(usageProfileId));
      const [typicalBaseLine, usageProfile] = <[LeanDocument<GenabilityUsageData>, LeanDocument<UsageProfileDocument>]>(
        await Promise.all(handlers)
      );

      hourlyDataForTheYear = this.calculate8760OnActualMonthlyUsage(
        typicalBaseLine.typicalBaseline.typicalHourlyUsage,
        utilityData.computedUsage.monthlyUsage,
        usageProfile,
      ) as UsageValue[];
    }

    const usageCost = await this.calculateCost(
      hourlyDataForTheYear.map(item => item.v),
      masterTariffId,
      CALCULATION_MODE.ACTUAL,
      data.utilityData.typicalBaselineUsage.zipCode,
      medicalBaselineAmount ?? utilityUsageDetailData?.medicalBaselineAmount,
      new Date().getFullYear(),
    );

    const costData = {
      masterTariffId,
      actualUsageCost: null as any,
      computedCost: usageCost,
    };

    return costData;
  }

  async calculateActualUsageCost(data: CalculateActualUsageCostDto): Promise<OperationResult<CostDataDto>> {
    const costData = await this.calculateActualUsageCostUtil(data);

    return OperationResult.ok(strictPlainToClass(CostDataDto, costData));
  }

  async createUtilityUsageDetail(utilityDto: CreateUtilityReqDto): Promise<OperationResult<UtilityDetailsDto>> {
    const found = await this.utilityUsageDetailsModel.findOne({ opportunityId: utilityDto.opportunityId }).lean();
    if (found) {
      delete found.utilityData.typicalBaselineUsage._id;
      let monthlyTariffData: IMonthSeasonTariff[][] = [];
      if (utilityDto.costData.postInstallMasterTariffId !== found.costData.postInstallMasterTariffId) {
        monthlyTariffData = await this.calculateTariffInfoByOpportunityId(utilityDto.opportunityId);
      } else {
        monthlyTariffData = await this.getTariffInfoByOpportunityId(utilityDto.opportunityId);
      }
      const result = { ...found, monthlyTariffData };
      return OperationResult.ok(strictPlainToClass(UtilityDetailsDto, result));
    }

    const typicalBaseLine = await this.getTypicalBaselineData(utilityDto.opportunityId);
    const { typicalHourlyUsage = [], typicalMonthlyUsage } = typicalBaseLine.typicalBaseline;
    utilityDto.utilityData.typicalBaselineUsage.typicalHourlyUsage = typicalHourlyUsage;

    if (utilityDto.hasMedicalBaseline && utilityDto.medicalBaselineAmount !== undefined) {
      const newCostData = await this.calculateActualUsageCostUtil({
        masterTariffId: utilityDto.costData.masterTariffId,
        utilityData: utilityDto.utilityData,
        usageProfileId: utilityDto.usageProfileId,
        opportunityId: utilityDto.opportunityId,
        medicalBaselineAmount: utilityDto.medicalBaselineAmount,
      });

      utilityDto.costData.actualUsageCost = newCostData.actualUsageCost;
      utilityDto.costData.computedCost = newCostData.computedCost;
    }

    const utilityModel = new UtilityUsageDetailsModel(utilityDto);

    if (utilityDto.entryMode !== ENTRY_MODE.CSV_INTERVAL_DATA) {
      const computedHourlyUsage = this.getHourlyUsageFromMonthlyUsage(
        utilityDto.utilityData.computedUsage.monthlyUsage,
        typicalMonthlyUsage,
        typicalHourlyUsage,
      );
      utilityModel.setComputedHourlyUsage(computedHourlyUsage);
    }

    const hourlyEstimatedUsage = this.getHourlyEstimatedUsage(utilityModel);
    utilityModel.setTotalPlannedUsageIncreases(sum(hourlyEstimatedUsage));

    const createdUtility = new this.utilityUsageDetailsModel(utilityModel);

    await createdUtility.save();
    const createdUtilityObj = createdUtility.toObject();
    const monthlyTariffData = await this.calculateTariffInfoByOpportunityId(utilityDto.opportunityId);
    const result = { ...createdUtilityObj, monthlyTariffData };
    return OperationResult.ok(strictPlainToClass(UtilityDetailsDto, result));
  }

  async updateMedicalBaseline(
    utilityId: ObjectId,
    medicalBaselineData: MedicalBaselineDataDto,
  ): Promise<OperationResult<UtilityDetailsDto>> {
    const utilityUsageDetailData = await this.utilityUsageDetailsModel.findById({ _id: utilityId });
    if (!utilityUsageDetailData) {
      throw ApplicationException.EntityNotFound(utilityId.toString());
    }

    utilityUsageDetailData.hasMedicalBaseline = medicalBaselineData.hasMedicalBaseline;
    if (medicalBaselineData.hasMedicalBaseline) {
      utilityUsageDetailData.medicalBaselineAmount = medicalBaselineData.medicalBaselineAmount;
    } else {
      utilityUsageDetailData.medicalBaselineAmount = undefined;
    }

    const { costData, utilityData, usageProfileId, opportunityId } = utilityUsageDetailData;
    const newCostData = await this.calculateActualUsageCostUtil({
      masterTariffId: costData.masterTariffId,
      utilityData,
      usageProfileId,
      opportunityId,
      medicalBaselineAmount: medicalBaselineData.medicalBaselineAmount,
    });

    utilityUsageDetailData.costData.actualUsageCost = newCostData.actualUsageCost;
    utilityUsageDetailData.costData.computedCost = newCostData.computedCost;

    await utilityUsageDetailData.save();

    return OperationResult.ok(strictPlainToClass(UtilityDetailsDto, utilityUsageDetailData));
  }

  async getUtilityUsageDetail(opportunityId: string): Promise<OperationResult<UtilityDetailsDto>> {
    const res = await this.getUtilityByOpportunityId(opportunityId);
    if (!res) {
      return OperationResult.ok(null as any);
    }
    delete res.utilityData.typicalBaselineUsage._id;
    const monthlyTariffData = await this.getTariffInfoByOpportunityId(opportunityId);
    const result = { ...res, monthlyTariffData };
    return OperationResult.ok(strictPlainToClass(UtilityDetailsDto, result));
  }

  async updateUtilityUsageDetailUtil(
    utilityId: ObjectId,
    utilityDto: CreateUtilityReqDto,
  ): Promise<LeanDocument<UtilityUsageDetails> | null> {
    const typicalBaseLine = await this.getTypicalBaselineData(utilityDto.opportunityId);
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

    const hourlyEstimatedUsage = this.getHourlyEstimatedUsage(utilityModel);
    utilityModel.setTotalPlannedUsageIncreases(sum(hourlyEstimatedUsage));

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

    return updatedUtility;
  }

  async updateUtilityUsageDetail(
    utilityId: ObjectId,
    utilityDto: CreateUtilityReqDto,
  ): Promise<OperationResult<UtilityDetailsDto>> {
    const found = await this.utilityUsageDetailsModel.findOne({ opportunityId: utilityDto.opportunityId }).lean();

    const updatedUtility = await this.updateUtilityUsageDetailUtil(utilityId, utilityDto);
    let monthlyTariffData: IMonthSeasonTariff[][] = [];
    if (updatedUtility?.costData.postInstallMasterTariffId !== found?.costData.postInstallMasterTariffId) {
      monthlyTariffData = await this.calculateTariffInfoByOpportunityId(utilityDto.opportunityId);
    } else {
      monthlyTariffData = await this.getTariffInfoByOpportunityId(utilityDto.opportunityId);
    }

    const result = { ...updatedUtility, monthlyTariffData };

    return OperationResult.ok(strictPlainToClass(UtilityDetailsDto, result));
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

  getHourlyEstimatedUsage(utility: UtilityUsageDetailsModel | LeanDocument<UtilityUsageDetails>): number[] {
    const {
      utilityData: {
        computedUsage: { annualConsumption, monthlyUsage, hourlyUsage },
      },
      usageProfileSnapshot,
      increaseAmount,
      poolValue,
      electricVehicles = [],
    } = utility;

    let poolUsageKwh = 0;
    if (poolValue) {
      poolUsageKwh = poolValue / hourlyUsage.length;
    }

    const hourlyUsageLoadShapping = this.calculate8760OnActualMonthlyUsage(
      hourlyUsage,
      monthlyUsage,
      usageProfileSnapshot,
    ) as IUsageValue[];

    const sumSingleElectricVehicleKwh: number[] = [];
    if (electricVehicles.length) {
      const everyElectricVehicleKwh: number[][] = [];
      electricVehicles.forEach(e => {
        const {
          chargerType,
          milesDrivenPerDay,
          startChargingHour,
          electricVehicleSnapshot: { kwhPer100Miles },
        } = e;

        const _hourlyUsage = Array(24).fill(0);

        const chargingRate = chargerType.rating;

        const kwhRequiredPerDay = roundNumber(milesDrivenPerDay * (kwhPer100Miles / 100), 2);

        if (kwhRequiredPerDay < chargingRate) {
          _hourlyUsage[startChargingHour] = kwhRequiredPerDay;
        } else {
          let kwhRequiredPerDayRemaining = kwhRequiredPerDay;
          const hoursAmount = roundUpNumber(kwhRequiredPerDay / chargingRate);
          const hoursLength = 24 + hoursAmount;
          for (let i = startChargingHour; i < hoursLength; ++i) {
            const index = i % 24;
            _hourlyUsage[index] = roundNumber(
              _hourlyUsage[index] + kwhRequiredPerDayRemaining > chargingRate
                ? chargingRate
                : kwhRequiredPerDayRemaining,
              2,
            );
            if (kwhRequiredPerDayRemaining > chargingRate) {
              kwhRequiredPerDayRemaining = roundNumber(kwhRequiredPerDayRemaining - chargingRate, 2);
            } else {
              break;
            }
          }
        }
        everyElectricVehicleKwh.push(_hourlyUsage);
      });

      const singleElectricVehicleKwh = everyElectricVehicleKwh.reduce((acc, cur) => acc.concat(cur), []);
      const singleElectricVehicleKwhLength = singleElectricVehicleKwh.length;

      for (let i = 0; i < singleElectricVehicleKwhLength; ++i) {
        const index = i % 24;
        sumSingleElectricVehicleKwh[index] = (sumSingleElectricVehicleKwh[index] || 0) + singleElectricVehicleKwh[i];
      }
    }

    const result: number[] = [];

    for (let hourIndex = 0; hourIndex < hourlyUsageLoadShapping.length; ++hourIndex) {
      // calculate Planned Usage Increases Kwh
      hourlyUsageLoadShapping[hourIndex].v +=
        annualConsumption && (hourlyUsageLoadShapping[hourIndex].v * increaseAmount) / annualConsumption;

      // calculate Pool Usage Kwh
      if (poolUsageKwh) {
        hourlyUsageLoadShapping[hourIndex].v += poolUsageKwh;
      }

      // calculate Electric Vehicle
      if (electricVehicles.length) {
        hourlyUsageLoadShapping[hourIndex].v += sumSingleElectricVehicleKwh[hourIndex % 24];
      }

      result.push(hourlyUsageLoadShapping[hourIndex].v);
    }

    return result;
  }

  private isHourInDay(hourInDay: number, fromHour: number, toHour: number): boolean {
    if (fromHour < toHour) {
      return inRange(hourInDay, fromHour, toHour);
    }

    return inRange(hourInDay, 0, toHour) || inRange(hourInDay, fromHour, 24);
  }

  private checkDayOfWeekIsInDayOfWeekAndHourInDayIsInHourOfDay = (
    fromDayOfWeek: number,
    toDayOfWeek: number,
    dayOfWeek: number,
    fromHour: number,
    toHour: number,
    hourInDay: number,
  ): boolean => {
    let isAllDay = false;
    if (fromHour === toHour) {
      isAllDay = true;
    }

    if (fromDayOfWeek < toDayOfWeek) {
      return (
        inRange(dayOfWeek, fromDayOfWeek, toDayOfWeek + 1) &&
        (isAllDay || this.isHourInDay(hourInDay, fromHour, toHour))
      );
    }

    return (
      (inRange(dayOfWeek, 0, fromDayOfWeek + 1) || inRange(dayOfWeek, toDayOfWeek, 6 + 1)) &&
      (isAllDay || this.isHourInDay(hourInDay, fromHour, toHour))
    );
  };

  private filterTariffs = async (postInstallMasterTariffId: string) => {
    const filterTariffs = await this.externalService.getTariffsByMasterTariffId(postInstallMasterTariffId);

    // Filter the tariff rates to ones where applicabilityKey is blank, variableRateKey is blank, and timeOfUse is NOT blank.
    return filterTariffs[0].rates
      .filter(e => !e?.applicabilityKey && !e?.variableRateKey && e?.timeOfUse)
      .map(filterTariff => ({
        ...filterTariff,
        // if rateBands had multiple rateAmount sum up the rateAmount.
        rateBands:
          filterTariff.rateBands.length > 1
            ? filterTariff.rateBands.reduce((previousValue, currentValue) => {
                const currentRateAmount = currentValue.rateAmount;
                delete currentValue.rateAmount;
                return [
                  {
                    ...currentValue,
                    rateAmount: (previousValue[0]?.rateAmount || 0) + currentRateAmount,
                  },
                ];
              }, [])
            : filterTariff.rateBands,
      }));
  };

  calculatePinballDataIn24Hours(
    hourlyPostInstallLoadIn24Hours: number[],
    hourlySeriesForExistingPVIn24Hours: number[] | undefined,
    hourlySeriesForNewPVIn24Hours: number[],
    rateAmountHourlyIn24Hours: IPinballRateAmount[],
    batterySystemSpecs: BatterySystemSpecsDto,
    ratingInKW: number,
    minimumReserveInKW: number,
    sqrtRoundTripEfficiency: number,
    batteryStoredEnergySeriesInPrevious24Hours: number[],
    chargingLogicType: CHARGING_LOGIC_TYPE = CHARGING_LOGIC_TYPE.NEM2,
  ): {
    batteryStoredEnergySeriesIn24Hours: number[];
    batteryChargingSeriesIn24Hours: number[];
    batteryDischargingSeriesIn24Hours: number[];
    postInstallSiteDemandSeriesIn24Hours: number[];
  } {
    const pvGenerationIn24Hours: number[] = [];
    // The difference between house usage and PV generation
    const netLoadIn24Hours: number[] = [];

    const plannedBatteryACIn24Hours: number[] = [];
    const plannedBatteryDCIn24Hours: number[] = [];
    const batteryStoredEnergySeriesIn24Hours: number[] = [];
    const actualBatteryDCIn24Hours: number[] = [];
    const actualBatteryACIn24Hours: number[] = [];
    const batteryChargingSeriesIn24Hours: number[] = [];
    const batteryDischargingSeriesIn24Hours: number[] = [];
    const postInstallSiteDemandSeriesIn24Hours: number[] = [];
    for (let i = 0; i < 24; i += 1) {
      // Temporary exclude existingPV from PINBALL calculation due to incorrect Net Load value. Ref wav-2640
      //
      // pvGenerationIn24Hours.push(
      //   new BigNumber(hourlySeriesForExistingPVIn24Hours?.[i] || 0)
      //     .plus(hourlySeriesForNewPVIn24Hours[i] || 0)
      //     .toNumber(),
      // );

      pvGenerationIn24Hours.push(hourlySeriesForNewPVIn24Hours[i] || 0);
      netLoadIn24Hours.push(
        new BigNumber(hourlyPostInstallLoadIn24Hours[i] || 0).minus(pvGenerationIn24Hours[i]).toNumber(),
      );

      // Planned Battery AC
      switch (batterySystemSpecs.operationMode) {
        case BATTERY_PURPOSE.BACKUP_POWER:
          plannedBatteryACIn24Hours.push(Math.min(pvGenerationIn24Hours[i], ratingInKW));
          break;
        case BATTERY_PURPOSE.PV_SELF_CONSUMPTION:
          plannedBatteryACIn24Hours.push(-Math.min(Math.max(netLoadIn24Hours[i], -ratingInKW), ratingInKW));
          break;
        case BATTERY_PURPOSE.ADVANCED_TOU_SELF_CONSUMPTION:
          if (chargingLogicType === CHARGING_LOGIC_TYPE.NEM3) {
            let plannedBatteryAC: number;

            if (rateAmountHourlyIn24Hours[i].shouldCharge) {
              // there are excess PV (pvGeneration > hourlyPostInstallLoad) to charge into battery
              // => netLoad < 0
              plannedBatteryAC = Math.min(-netLoadIn24Hours[i], ratingInKW);
            } else if (rateAmountHourlyIn24Hours[i].shouldDischarge) {
              plannedBatteryAC = -Math.min(Math.max(netLoadIn24Hours[i], -ratingInKW), ratingInKW);
            } else {
              // pvGeneration is just enough to cover hourlyPostInstallLoad
              // or not enough PV to cover the load, but remaining load should be covered by importing
              plannedBatteryAC = 0;
            }

            plannedBatteryACIn24Hours.push(plannedBatteryAC);
          } else if (chargingLogicType === CHARGING_LOGIC_TYPE.NEM2) {
            plannedBatteryACIn24Hours.push(
              rateAmountHourlyIn24Hours[i].shouldCharge
                ? Math.min(pvGenerationIn24Hours[i], ratingInKW)
                : -Math.min(Math.max(netLoadIn24Hours[i], -ratingInKW), ratingInKW),
            );
          }
          break;
        default:
      }

      // Planned Battery DC
      if (plannedBatteryACIn24Hours[i] > 0) {
        plannedBatteryDCIn24Hours.push(
          new BigNumber(plannedBatteryACIn24Hours[i]).multipliedBy(sqrtRoundTripEfficiency).toNumber(),
        );
      } else {
        plannedBatteryDCIn24Hours.push(
          new BigNumber(plannedBatteryACIn24Hours[i]).dividedBy(sqrtRoundTripEfficiency).toNumber() || 0,
        );
      }

      // Battery Stored Energy
      batteryStoredEnergySeriesIn24Hours.push(
        Math.max(
          minimumReserveInKW,
          Math.min(
            ((i === 0
              ? batteryStoredEnergySeriesInPrevious24Hours[batteryStoredEnergySeriesInPrevious24Hours.length - 1]
              : batteryStoredEnergySeriesIn24Hours[i - 1]) || minimumReserveInKW) + plannedBatteryDCIn24Hours[i],
            batterySystemSpecs.totalCapacityInKWh * 1000,
          ),
        ),
      );

      // Actual Battery DC
      actualBatteryDCIn24Hours.push(
        new BigNumber(batteryStoredEnergySeriesIn24Hours[i])
          .minus(
            (i === 0
              ? batteryStoredEnergySeriesInPrevious24Hours[batteryStoredEnergySeriesInPrevious24Hours.length - 1]
              : batteryStoredEnergySeriesIn24Hours[i - 1]) || minimumReserveInKW,
          )
          .toNumber(),
      );

      // Actual Battery AC
      actualBatteryACIn24Hours.push(
        actualBatteryDCIn24Hours[i] > 0
          ? new BigNumber(actualBatteryDCIn24Hours[i]).dividedBy(sqrtRoundTripEfficiency).toNumber()
          : new BigNumber(actualBatteryDCIn24Hours[i]).multipliedBy(sqrtRoundTripEfficiency).toNumber(),
      );

      // battery charging
      batteryChargingSeriesIn24Hours.push(actualBatteryACIn24Hours[i] > 0 ? actualBatteryACIn24Hours[i] : 0);

      // battery discharging
      batteryDischargingSeriesIn24Hours.push(actualBatteryACIn24Hours[i] < 0 ? -actualBatteryACIn24Hours[i] : 0);

      // site demand
      postInstallSiteDemandSeriesIn24Hours.push(
        new BigNumber(netLoadIn24Hours[i]).plus(actualBatteryACIn24Hours[i]).toNumber(),
      );
    }

    return {
      batteryStoredEnergySeriesIn24Hours,
      batteryChargingSeriesIn24Hours,
      batteryDischargingSeriesIn24Hours,
      postInstallSiteDemandSeriesIn24Hours,
    };
  }

  buildNEM2ChargingLogic = (rateAmountHourly: IPinballRateAmount[]): IPinballRateAmount[] => {
    // current/NEM2 charging logic
    // iterate through the hours of the year, jumping from period to period
    // a 'period' is 1 or more consecutive hours with the same cost of electricity
    for (let firstHourOfThisPeriod = 0; true; ) {
      // the cost of electricity in the current period
      const rateThisPeriod = rateAmountHourly[firstHourOfThisPeriod].rate;
      // the cost of electricity in the next period
      let rateNextPeriod: number | undefined;

      // look ahead for the next period
      let firstHourOfNextPeriod: number | undefined;
      for (let i = firstHourOfThisPeriod + 1; i < rateAmountHourly.length; i++) {
        // if the rate is different than the current rate
        if (rateAmountHourly[i].rate !== rateThisPeriod) {
          // then we have found the next period
          firstHourOfNextPeriod = i;
          break;
        }
      }

      // if we did not find the next period, then this is the last period of the year
      if (!firstHourOfNextPeriod) {
        // and we need to search from the beginning of the year, to find the next rate
        for (let i = 0; i < rateAmountHourly.length; i++) {
          // if the rate is different than the current rate
          if (rateAmountHourly[i].rate !== rateThisPeriod) {
            // then we have found the next rate
            rateNextPeriod = rateAmountHourly[i].rate;
            break;
          }
        }

        // if we did not find the next rate, then the whole year is one rate
        if (!rateNextPeriod) {
          // and we need to set the charge plan for the full year
          for (let i = 0; i < rateAmountHourly.length; i++) {
            // always discharge if necessary; similar to pv self-consumption
            rateAmountHourly[i].shouldDischarge = true;
          }
          // we're done
          break;
        }

        // WAV-1727 implements this NEM2 Advanced TOU charging plan:
        // Charge if the next period is more expensive than the current one.
        // Discharge if the next period is cheaper than the current one.
        const shouldChargeDuringLastPeriodOfTheYear = rateNextPeriod > rateThisPeriod;

        // set the charge flag for the rest of the year
        if (shouldChargeDuringLastPeriodOfTheYear) {
          for (let i = firstHourOfThisPeriod; i < rateAmountHourly.length; i++) {
            rateAmountHourly[i].shouldCharge = true;
          }
        } else {
          for (let i = firstHourOfThisPeriod; i < rateAmountHourly.length; i++) {
            rateAmountHourly[i].shouldDischarge = true;
          }
        }

        // we're done
        break;
      }

      // get the rate for next period
      rateNextPeriod = rateAmountHourly[firstHourOfNextPeriod].rate;

      // WAV-1727 implements this NEM2 Advanced TOU charging plan:
      // Charge if the next period is more expensive than the current one.
      // Discharge if the next period is cheaper than the current one.
      const shouldChargeDuringThisPeriod = rateNextPeriod > rateThisPeriod;

      // set the charge flag for all the hours of this period
      if (shouldChargeDuringThisPeriod) {
        for (let i = firstHourOfThisPeriod; i < firstHourOfNextPeriod; i++) {
          rateAmountHourly[i].shouldCharge = true;
        }
      } else {
        for (let i = firstHourOfThisPeriod; i < firstHourOfNextPeriod; i++) {
          rateAmountHourly[i].shouldDischarge = true;
        }
      }

      // advance the cursor to the first hour of the next period
      firstHourOfThisPeriod = firstHourOfNextPeriod;
    }

    return rateAmountHourly;
  };

  buildNEM3ChargingLogic = (
    rateAmountHourlyForNEM2: IPinballRateAmount[],
    hourlySeriesForNewPV: number[],
    hourlyPostInstallLoad: number[],
  ): IPinballRateAmount[] => {
    // NEM3 charging logic
    // re-use data from NEM2 charging logic
    const rateAmountHourlyForNEM3 = cloneDeep(rateAmountHourlyForNEM2);

    for (let i = 0; i < rateAmountHourlyForNEM3.length; i++) {
      const excessPV = new BigNumber(hourlySeriesForNewPV[i] || 0).minus(hourlyPostInstallLoad[i]).toNumber();

      if (rateAmountHourlyForNEM3[i].shouldCharge) {
        // next period is more expensive than the current period
        if (excessPV <= 0) {
          // no excess PV to charge into the battery
          rateAmountHourlyForNEM3[i].shouldCharge = false;
        }
      } else if (rateAmountHourlyForNEM3[i].shouldDischarge) {
        // next period is less expensive than the current period
        if (excessPV === 0) {
          // no excess PV to charge into the battery
          rateAmountHourlyForNEM3[i].shouldDischarge = false;
        } else if (excessPV > 0) {
          // excess PV should charge into the battery
          rateAmountHourlyForNEM3[i].shouldCharge = true;
          rateAmountHourlyForNEM3[i].shouldDischarge = false;
        }
      }
    }

    return rateAmountHourlyForNEM3;
  };

  async simulatePinball(data: GetPinballSimulatorDto): Promise<PinballSimulatorDto> {
    const {
      hourlyPostInstallLoad,
      hourlySeriesForExistingPV,
      hourlySeriesForNewPV,
      postInstallMasterTariffId,
      zipCode,
      batterySystemSpecs,
      medicalBaselineAmount,
    } = data;

    let filterTariffs: any[] = [];
    let chargingLogicType: CHARGING_LOGIC_TYPE | undefined;

    if (batterySystemSpecs.operationMode === BATTERY_PURPOSE.ADVANCED_TOU_SELF_CONSUMPTION) {
      [filterTariffs, chargingLogicType] = await Promise.all([
        this.filterTariffs(postInstallMasterTariffId),
        this.getChargingLogicType(postInstallMasterTariffId),
      ]);
    }

    // generate 8760 charge or discharge the battery.
    const rateAmountHourly: IPinballRateAmount[] = [];

    const currentYear = data?.year ?? new Date().getFullYear();

    // DST is second Sunday in March to the first Sunday in November of year
    const secondSundayInMarch = dayjs(
      new Date(currentYear, 3 - 1, firstSundayOfTheMonth(currentYear, 3) + 7),
    ).dayOfYear();

    const firstSundayInNovember = dayjs(
      new Date(currentYear, 11 - 1, firstSundayOfTheMonth(currentYear, 11)),
    ).dayOfYear();

    const fromDST = (secondSundayInMarch - 1) * 24;

    const toDST = (firstSundayInNovember - 1) * 24 + 1;

    // Build rateAmountHourly
    for (let hourIndex = 0; hourIndex < 8760; hourIndex += 1) {
      let totalRateAmountHourly = new BigNumber(0);

      filterTariffs.forEach(filterTariff => {
        const season = filterTariff.timeOfUse.season || filterTariff.season;
        if (!season) return;

        const { seasonFromMonth, seasonToMonth, seasonFromDay, seasonToDay } = season;
        const rateAmountTotal = filterTariff?.rateBands[0]?.rateAmount || 0;

        const fromHourIndex = (dayjs(new Date(currentYear, seasonFromMonth - 1, seasonFromDay)).dayOfYear() - 1) * 24;
        const toHourIndex = dayjs(new Date(currentYear, seasonToMonth - 1, seasonToDay)).dayOfYear() * 24;

        const hourIndexWithDST = fromDST < hourIndex && hourIndex < toDST ? hourIndex + 1 : hourIndex;

        const isValidSeason =
          fromHourIndex < toHourIndex
            ? inRange(hourIndexWithDST, fromHourIndex, toHourIndex)
            : inRange(hourIndexWithDST, 0, toHourIndex) || inRange(hourIndexWithDST, fromHourIndex, 8760);

        if (!isValidSeason) {
          return;
        }

        const dayOfWeek = dayjs()
          .dayOfYear(Math.floor(hourIndexWithDST / 24) + 1)
          .day();

        const hourInDay = hourIndexWithDST % 24;

        let checkIsValidHourDay = false;

        for (let i = 0; i < filterTariff?.timeOfUse.touPeriods.length; i++) {
          const { fromDayOfWeek, toDayOfWeek, fromHour, toHour } = filterTariff?.timeOfUse.touPeriods[i];
          const isValidHourDay = this.checkDayOfWeekIsInDayOfWeekAndHourInDayIsInHourOfDay(
            fromDayOfWeek,
            toDayOfWeek,
            dayOfWeek,
            fromHour,
            toHour,
            hourInDay,
          );
          if (isValidHourDay) {
            checkIsValidHourDay = true;
            break;
          }
        }

        if (!checkIsValidHourDay) return;

        totalRateAmountHourly = totalRateAmountHourly.plus(rateAmountTotal);
      });
      rateAmountHourly.push({ rate: totalRateAmountHourly.toNumber(), shouldCharge: false, shouldDischarge: false });
    }

    const rateAmountHourlyForNEM2 = this.buildNEM2ChargingLogic(rateAmountHourly);

    const ratingInKW = batterySystemSpecs.totalRatingInKW * 1000;
    const minimumReserveInKW = (batterySystemSpecs.totalCapacityInKWh * 1000 * batterySystemSpecs.minimumReserve) / 100;
    const sqrtRoundTripEfficiency = Math.sqrt(batterySystemSpecs.roundTripEfficiency / 100);

    const pinballDataForNEM2 = this.calculatePinballData(
      hourlyPostInstallLoad,
      hourlySeriesForExistingPV,
      hourlySeriesForNewPV,
      rateAmountHourlyForNEM2,
      batterySystemSpecs,
      ratingInKW,
      minimumReserveInKW,
      sqrtRoundTripEfficiency,
    );

    // PINBALL Battery Charging Logic for NEM3
    if (chargingLogicType === CHARGING_LOGIC_TYPE.NEM3) {
      const rateAmountHourlyForNEM3 = this.buildNEM3ChargingLogic(
        rateAmountHourlyForNEM2,
        hourlySeriesForNewPV,
        hourlyPostInstallLoad,
      );

      const pinballDataForNEM3 = this.calculatePinballData(
        hourlyPostInstallLoad,
        hourlySeriesForExistingPV,
        hourlySeriesForNewPV,
        rateAmountHourlyForNEM3,
        batterySystemSpecs,
        ratingInKW,
        minimumReserveInKW,
        sqrtRoundTripEfficiency,
        chargingLogicType,
      );

      const [
        { annualCost: costPostInstallationForNEM2 },
        { annualCost: costPostInstallationForNEM3 },
      ] = await Promise.all([
        this.externalService.calculateAnnualBill({
          hourlyDataForTheYear: pinballDataForNEM2.postInstallSiteDemandSeries.map(i => i / 1000),
          masterTariffId: postInstallMasterTariffId,
          zipCode,
          medicalBaselineAmount,
        }),
        this.externalService.calculateAnnualBill({
          hourlyDataForTheYear: pinballDataForNEM3.postInstallSiteDemandSeries.map(i => i / 1000),
          masterTariffId: postInstallMasterTariffId,
          zipCode,
          medicalBaselineAmount,
        }),
      ]);

      if (costPostInstallationForNEM2 >= costPostInstallationForNEM3) {
        const {
          batteryStoredEnergySeries,
          batteryChargingSeries,
          batteryDischargingSeries,
          postInstallSiteDemandSeries,
        } = pinballDataForNEM3;

        return {
          batteryStoredEnergySeries,
          batteryChargingSeries,
          batteryDischargingSeries,
          postInstallSiteDemandSeries,
          rateAmountHourly: rateAmountHourlyForNEM3,
          chargingLogicType,
        };
      }
    }

    const {
      batteryStoredEnergySeries,
      batteryChargingSeries,
      batteryDischargingSeries,
      postInstallSiteDemandSeries,
    } = pinballDataForNEM2;

    return {
      batteryStoredEnergySeries,
      batteryChargingSeries,
      batteryDischargingSeries,
      postInstallSiteDemandSeries,
      rateAmountHourly: rateAmountHourlyForNEM2,
      chargingLogicType,
    };
  }

  calculatePinballData(
    hourlyPostInstallLoad: number[],
    hourlySeriesForExistingPV: number[] | undefined,
    hourlySeriesForNewPV: number[],
    rateAmountHourly: IPinballRateAmount[],
    batterySystemSpecs: BatterySystemSpecsDto,
    ratingInKW: number,
    minimumReserveInKW: number,
    sqrtRoundTripEfficiency: number,
    chargingLogicType: CHARGING_LOGIC_TYPE = CHARGING_LOGIC_TYPE.NEM2,
  ): {
    batteryStoredEnergySeries: number[];
    batteryChargingSeries: number[];
    batteryDischargingSeries: number[];
    postInstallSiteDemandSeries: number[];
  } {
    const batteryStoredEnergySeries: number[] = [];
    const batteryChargingSeries: number[] = [];
    const batteryDischargingSeries: number[] = [];
    const postInstallSiteDemandSeries: number[] = [];

    let batteryStoredEnergySeriesInPrevious24Hours: number[] = [];

    for (let i = 0; i < 365; i += 1) {
      const startIdx = i * 24;
      const endIdx = startIdx + 24;
      const hourlyPostInstallLoadIn24Hours: number[] = hourlyPostInstallLoad.slice(startIdx, endIdx);
      const hourlySeriesForExistingPVIn24Hours: number[] | undefined = hourlySeriesForExistingPV?.slice(
        startIdx,
        endIdx,
      );
      const hourlySeriesForNewPVIn24Hours: number[] = hourlySeriesForNewPV.slice(startIdx, endIdx);
      const rateAmountHourlyIn24Hours: IPinballRateAmount[] = rateAmountHourly.slice(startIdx, endIdx);

      const {
        batteryStoredEnergySeriesIn24Hours,
        batteryChargingSeriesIn24Hours,
        batteryDischargingSeriesIn24Hours,
        postInstallSiteDemandSeriesIn24Hours,
      } = this.calculatePinballDataIn24Hours(
        hourlyPostInstallLoadIn24Hours,
        hourlySeriesForExistingPVIn24Hours,
        hourlySeriesForNewPVIn24Hours,
        rateAmountHourlyIn24Hours,
        batterySystemSpecs,
        ratingInKW,
        minimumReserveInKW,
        sqrtRoundTripEfficiency,
        batteryStoredEnergySeriesInPrevious24Hours,
        chargingLogicType,
      );

      batteryStoredEnergySeriesInPrevious24Hours = batteryStoredEnergySeriesIn24Hours;

      batteryStoredEnergySeries.push(...batteryStoredEnergySeriesIn24Hours);
      batteryChargingSeries.push(...batteryChargingSeriesIn24Hours);
      batteryDischargingSeries.push(...batteryDischargingSeriesIn24Hours);
      postInstallSiteDemandSeries.push(...postInstallSiteDemandSeriesIn24Hours);
    }

    return {
      batteryStoredEnergySeries,
      batteryChargingSeries,
      batteryDischargingSeries,
      postInstallSiteDemandSeries,
    };
  }

  async pinballSimulatorAndCostPostInstallation(
    data: GetPinballSimulatorAndCostPostInstallationDto,
  ): Promise<OperationResult<PinballSimulatorAndCostPostInstallationDto>> {
    const pinballSimulatorOutput = await this.simulatePinball(data);
    const { annualCost: costPostInstallation } = await this.externalService.calculateAnnualBill({
      hourlyDataForTheYear: pinballSimulatorOutput.postInstallSiteDemandSeries.map(i => i / 1000),
      masterTariffId: data.postInstallMasterTariffId,
      zipCode: data.zipCode,
      startDate: data.startDate,
    });
    const result = { ...pinballSimulatorOutput, costPostInstallation };

    return OperationResult.ok(strictPlainToClass(PinballSimulatorAndCostPostInstallationDto, result));
  }

  async getExistingSystemProductionByOpportunityId(opportunityId: string, shouldGetHourlyProduction = false) {
    const foundOpportunity = await this.opportunityService.getDetailById(opportunityId);

    if (!foundOpportunity) {
      throw new NotFoundException(`No opportunity found with id: ${opportunityId}`);
    }

    const [foundContact, existingSystems] = await Promise.all([
      this.contactService.getContactById(foundOpportunity.contactId),
      this.existingSystemService.getAll({ opportunityId }),
    ]);

    if (!foundContact) {
      throw new NotFoundException(`No contact found with id: ${foundOpportunity.contactId}`);
    }

    const { lat, lng } = foundContact;

    const existingSystemProductions = await Promise.all(
      existingSystems.reduce(
        (prev, current) => [
          ...prev,
          ...current.array.map(({ existingPVSize, existingPVAzimuth, existingPVPitch }) =>
            this.systemProductService.calculatePVProduction({
              latitude: lat || 0,
              longitude: lng || 0,
              systemCapacityInkWh: existingPVSize,
              azimuth: existingPVAzimuth ?? 180,
              pitch: existingPVPitch ?? (lat || 0),
              losses: 14,
              shouldGetHourlyProduction,
            }),
          ),
        ],
        [],
      ),
    );

    const monthlyProduction = existingSystemProductions.reduce(
      (prev, current) =>
        current.monthly.map((value, monthIdx) => ({
          i: monthIdx + 1,
          v: value + (prev[monthIdx]?.v || 0),
        })),
      [] as IUsageValue[],
    );

    const hourlyProduction = !shouldGetHourlyProduction
      ? []
      : existingSystemProductions.reduce(
          (prev, current) => current.hourly.map((value, hourIndex) => value + (prev[hourIndex] || 0)),
          [],
        );

    return {
      monthlyProduction,
      annualProduction: sumBy(monthlyProduction, 'v'),
      hourlyProduction,
    };
  }

  async getExistingSystemProduction(opportunityId: string): Promise<OperationResult<ExistingSystemProductionDto>> {
    const res = await this.getExistingSystemProductionByOpportunityId(opportunityId, true);
    return OperationResult.ok(strictPlainToClass(ExistingSystemProductionDto, res));
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

  async getTypicalBaselineData(opportunityId: string): Promise<LeanDocument<GenabilityUsageData>> {
    const typicalBaselineParams = await this.opportunityService.getTypicalBaselineContactById(opportunityId);
    let typicalBaseLine: any = await this.genabilityUsageDataModel
      .findOne({ zipCode: typicalBaselineParams.zipCode })
      .lean();
    if (typicalBaseLine) {
      return typicalBaseLine;
    }

    const typicalBaseLineAPI = await this.externalService.getTypicalBaseLine(typicalBaselineParams);
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
    zipCode: number,
    medicalBaselineAmount?: number,
    year?: number,
  ): Promise<IUtilityCostData> {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let genabilityCost: GenabilityCostData | null = null;

    if (mode === CALCULATION_MODE.TYPICAL) {
      genabilityCost = await this.genabilityCostDataModel.findOne({ masterTariffId });

      if (genabilityCost) {
        const genabilityCostYear = new Date(genabilityCost.utilityCost.startDate).getFullYear();
        const genabilityCostMonth = new Date(genabilityCost.utilityCost.startDate).getMonth();
        if (
          genabilityCostYear === currentYear &&
          genabilityCostMonth === currentMonth + 1 &&
          genabilityCost.utilityCost.annualCost
        ) {
          return genabilityCost.utilityCost;
        }
      }
    }

    const data = await this.externalService.calculateAnnualBill({
      hourlyDataForTheYear,
      masterTariffId,
      zipCode,
      medicalBaselineAmount,
    });

    const { annualCost, fromDateTime, toDateTime } = data;

    const costData = {
      startDate: new Date(fromDateTime),
      endDate: new Date(toDateTime),
      interval: INTERVAL_VALUE.YEAR,
      annualCost,
    } as IUtilityCostData;

    if (mode === CALCULATION_MODE.TYPICAL) {
      const genabilityCostData = {
        zipCode,
        masterTariffId,
        utilityCost: costData,
      };

      if (!genabilityCost) {
        const createdGenabilityCost = new this.genabilityCostDataModel(genabilityCostData);
        await createdGenabilityCost.save();
      } else {
        genabilityCost.utilityCost = costData;
        await genabilityCost.save();
      }
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

    const condition = [744, 1416, 2160, 2880, 3624, 4344, 5088, 5832, 6552, 7296, 8016, 8760];

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

  /**
   * Calculate 8760 by scale it on Actual Monthly Usage, if has param usageProfile it will scale by seasons
   *
   * if hourlyUsage's type is UsageValue[] it will return IUsageValue[] else return number[]
   */
  calculate8760OnActualMonthlyUsage(
    hourlyUsage: (UsageValue | number)[], // 8760
    actualMonthlyUsage: (UsageValue | number)[], // MonthlyUsage
    usageProfile?: IUsageProfile,
  ): (IUsageValue | number)[] {
    let typical8760Usage: number[];
    let actualMonthlyUsageTemp: number[];

    const typicalUsageByMonth = Array.from({ length: 12 }, () => 0);

    if (typeof hourlyUsage[0] !== 'number') {
      typical8760Usage = (hourlyUsage as UsageValue[]).map(e => e.v);
      actualMonthlyUsageTemp = (actualMonthlyUsage as UsageValue[]).map(e => e.v);
    } else {
      typical8760Usage = hourlyUsage as number[];
      actualMonthlyUsageTemp = actualMonthlyUsage as number[];
    }

    typical8760Usage.forEach((v, hourIndex) => {
      const dayOfYear = dayjs().dayOfYear(Math.ceil((hourIndex + 1) / 24));
      const monthIndex = dayOfYear.get('month');
      typicalUsageByMonth[monthIndex] = new BigNumber(typicalUsageByMonth[monthIndex]).plus(v).toNumber();
    });

    const scalingFactorByMonth = typicalUsageByMonth.map((monthlyUsage, index) =>
      monthlyUsage
        ? new BigNumber(actualMonthlyUsageTemp[index]).dividedBy(monthlyUsage).toNumber()
        : actualMonthlyUsageTemp[index],
    );

    const hourlyAllocationByMonth = Array.from({ length: 12 }, () => Array.from({ length: 24 }, () => 0));
    const targetMonthlyKwh = Array.from({ length: 12 }, () => 0);

    const scaledArray = typical8760Usage.map((v, hourIndex) => {
      const dayOfYear = dayjs().dayOfYear(Math.floor(hourIndex / 24) + 1);
      const monthIndex = dayOfYear.get('month');

      const scaledValue = new BigNumber(v).multipliedBy(scalingFactorByMonth[monthIndex]).toNumber();

      hourlyAllocationByMonth[monthIndex][(hourIndex - 1) % 24] = new BigNumber(
        hourlyAllocationByMonth[monthIndex][(hourIndex - 1) % 24],
      )
        .plus(scaledValue)
        .toNumber();

      targetMonthlyKwh[monthIndex] = new BigNumber(targetMonthlyKwh[monthIndex]).plus(scaledValue).toNumber();

      return scaledValue;
    });

    if (!usageProfile) {
      if (typeof hourlyUsage[0] !== 'number') {
        return scaledArray.map((e, i) => ({
          i,
          v: e,
        })) as IUsageValue[];
      }
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

    const shapedArray = scaledArray.map((v, hourIndex) => {
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

    if (typeof hourlyUsage[0] !== 'number') {
      return scaledArray.map((e, i) => ({
        i,
        v: e,
      })) as IUsageValue[];
    }
    return shapedArray;
  }

  public async getTariffInfoByOpportunityId(opportunityId): Promise<IMonthSeasonTariff[][]> {
    let monthlyTariffData: IMonthSeasonTariff[][] = [];
    let json;

    try {
      const { bucket, key } = this.getMonthlyTariffDataS3Info(opportunityId);
      json = await this.s3Service.getObject(bucket, key);
    } catch (_) {
      // do nothing
    }

    if (json) {
      monthlyTariffData = JSON.parse(json);
    } else {
      monthlyTariffData = await this.calculateTariffInfoByOpportunityId(opportunityId);
    }

    return monthlyTariffData;
  }

  public async calculateTariffInfoByOpportunityId(opportunityId): Promise<IMonthSeasonTariff[][]> {
    const utilityService = await this.getUtilityByOpportunityId(opportunityId);

    if (!utilityService) throw ApplicationException.EntityNotFound(`opportunityId: ${opportunityId}`);

    const filterTariffs = await this.filterTariffs(utilityService.costData.postInstallMasterTariffId);

    // Get seasons
    const seasons: any[] = [];

    const tariffsBySeasons: {
      [seasonName: string]: any[];
    } = {};

    filterTariffs.forEach(filterTariff => {
      const season = filterTariff.timeOfUse.season || filterTariff.season;

      if (!season) return;

      if (!seasons.length || seasons.findIndex(s => s.seasonId === season.seasonId) === -1) {
        seasons.push(season);
      }

      if (!tariffsBySeasons[season.seasonName]) {
        tariffsBySeasons[season.seasonName] = [];
      }
      tariffsBySeasons[season.seasonName].push(filterTariff);
    });

    if (!seasons.length) {
      const noSeasonsMonthlyTariffData: IMonthSeasonTariff[][] = [...Array(12)].map(() => []);
      const { bucket, key, contentType } = this.getMonthlyTariffDataS3Info(opportunityId);
      const json = JSON.stringify(noSeasonsMonthlyTariffData);
      await this.s3Service.putObject(bucket, key, json, contentType);
      return noSeasonsMonthlyTariffData;
    }

    const currentYear = dayjs().year();

    const datesInMonths = getMonthDatesOfYear(currentYear);

    // find seasons in month
    const seasonsInMonths: any[] = [];

    for (let i = 0; i < 12; i++) {
      const seasonsInMonth: any[] = [];
      const curMonth = i + 1;

      seasons.forEach(season => {
        const { seasonFromMonth, seasonToMonth, seasonName } = season;

        if (seasonFromMonth === seasonToMonth && seasonFromMonth === curMonth) {
          seasonsInMonth.push(seasonName);
        }

        if (seasonFromMonth < seasonToMonth && seasonFromMonth <= curMonth && curMonth <= seasonToMonth) {
          seasonsInMonth.push(seasonName);
        }

        if (seasonFromMonth > seasonToMonth && (seasonFromMonth <= curMonth || curMonth <= seasonToMonth)) {
          seasonsInMonth.push(seasonName);
        }
      });
      seasonsInMonths.push(seasonsInMonth);
    }

    const monthlyTariffData: IMonthSeasonTariff[][] = [];

    // Build monthlyTariffData
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const seasonsInMonth = seasonsInMonths[monthIndex];
      const totalDayInMonth = datesInMonths[monthIndex];

      const tariffDataOfSeasonsInMonth: IMonthSeasonTariff[] = [];

      seasonsInMonth.forEach(seasonName => {
        const tariffsBySeason = tariffsBySeasons[seasonName];

        const seasonInMonthTariffData: IMonthSeasonTariff = {
          seasonName,
          hourlyTariffRate: [...Array(24)],
        };

        for (let hourInDay = 0; hourInDay < 24; hourInDay++) {
          const ratesOfHour: number[] = [];

          for (let dayOfMonthIdx = 0; dayOfMonthIdx < totalDayInMonth; dayOfMonthIdx++) {
            const day = dayjs(new Date(currentYear, monthIndex, dayOfMonthIdx + 1));
            const dayOfWeek = day.day();

            let totalRateInDay = 0;

            tariffsBySeason.forEach(filterTariff => {
              const rateAmount = filterTariff?.rateBands[0]?.rateAmount || 0;

              let checkIsValidHourDay = false;

              for (let i = 0; i < filterTariff?.timeOfUse.touPeriods.length; i++) {
                const { fromDayOfWeek, toDayOfWeek, fromHour, toHour } = filterTariff?.timeOfUse.touPeriods[i];
                const isValidHourDay = this.checkDayOfWeekIsInDayOfWeekAndHourInDayIsInHourOfDay(
                  fromDayOfWeek,
                  toDayOfWeek,
                  dayOfWeek,
                  fromHour,
                  toHour,
                  hourInDay,
                );
                if (isValidHourDay) {
                  checkIsValidHourDay = true;
                  break;
                }
              }

              if (!checkIsValidHourDay) return;

              totalRateInDay += rateAmount;
            });

            ratesOfHour.push(totalRateInDay);
          }

          seasonInMonthTariffData.hourlyTariffRate[hourInDay] = roundNumber(mean(ratesOfHour), 5);
        }

        tariffDataOfSeasonsInMonth.push(seasonInMonthTariffData);
      });

      monthlyTariffData.push(tariffDataOfSeasonsInMonth);
    }

    const { bucket, key, contentType } = this.getMonthlyTariffDataS3Info(opportunityId);
    const json = JSON.stringify(monthlyTariffData);
    await this.s3Service.putObject(bucket, key, json, contentType);

    return monthlyTariffData;
  }

  private getMonthlyTariffDataS3Info(opportunityId: string) {
    return {
      bucket: this.AWS_S3_UTILITY_DATA,
      key: `${opportunityId}/monthlyTariffData.json`,
      contentType: 'application/json; charset=utf-8',
    };
  }

  private getChargingLogicType = async (postInstallMasterTariffId: string): Promise<CHARGING_LOGIC_TYPE> => {
    const filterTariffs = await this.externalService.getTariffsByMasterTariffId(postInstallMasterTariffId);

    const { tariffCode } = filterTariffs[0];

    if (tariffCode.includes(CHARGING_LOGIC_TYPE.NEM3)) return CHARGING_LOGIC_TYPE.NEM3;

    return CHARGING_LOGIC_TYPE.NEM2;
  };
}

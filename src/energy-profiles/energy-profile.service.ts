/* eslint-disable no-plusplus */
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { sumBy } from 'lodash';
import { ObjectId } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { GoogleSunroofService } from 'src/shared/google-sunroof/google-sunroof.service';
import { BATTERY_PURPOSE } from 'src/system-designs/constants';
import { SunroofHourlyProductionCalculation } from 'src/system-designs/sub-services';
import { SystemProductService } from 'src/system-designs/sub-services/system-product.service';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { PvWattProductionDto } from 'src/system-production/res';
import { IEnergyProfileProduction } from 'src/system-production/system-production.schema';
import { SystemProductionService } from 'src/system-production/system-production.service';
import { BatterySystemSpecsDto } from 'src/utilities/req';
import { IPinballRateAmount } from 'src/utilities/utility.interface';
import { UtilityService } from 'src/utilities/utility.service';
import {
  buildMonthlyAndAnnuallyDataFrom24HoursData,
  buildMonthlyAndAnnuallyDataFrom8760,
  getMonthlyAndAnnualAverageFrom8760,
  getMonthlyAndAnnualRateAmountFrom8760,
  getMonthlyAndAnnualWeekdayAverageFrom8760,
} from 'src/utils/transformData';

@Injectable()
export class EnergyProfileService {
  private PINBALL_SIMULATION_BUCKET = process.env.AWS_S3_PINBALL_SIMULATION as string;

  constructor(
    @Inject(forwardRef(() => SystemDesignService))
    private readonly systemDesignService: SystemDesignService,
    private readonly sunroofHourlyProductionCalculationService: SunroofHourlyProductionCalculation,
    private readonly systemProductionService: SystemProductionService,
    private readonly s3Service: S3Service,
    @Inject(forwardRef(() => UtilityService))
    private readonly utilityService: UtilityService,
    private readonly googleSunroofService: GoogleSunroofService,
    private readonly systemProductService: SystemProductService,
  ) {}

  async getPvWattProduction(systemDesignId: ObjectId): Promise<PvWattProductionDto | undefined> {
    const systemDesign = await this.systemDesignService.getDetails(systemDesignId);
    return systemDesign.data?.systemProductionData.pvWattProduction;
  }

  async getSunroofHourlyProduction(systemDesignId: ObjectId | string): Promise<IEnergyProfileProduction> {
    const foundSystemDesign = await this.systemDesignService.getOneById(systemDesignId);

    if (!foundSystemDesign) {
      throw new NotFoundException(`System design with id ${systemDesignId} not found`);
    }

    const cachedSunroofHourlyProduction = await this.sunroofHourlyProductionCalculationService.getS3HourlyProduction(
      foundSystemDesign.opportunityId,
      systemDesignId,
    );

    if (cachedSunroofHourlyProduction) return cachedSunroofHourlyProduction;

    const foundSystemProduction = await this.systemProductionService.findOne(foundSystemDesign.systemProductionId);

    if (!foundSystemProduction)
      throw new NotFoundException(`System production in system design with id ${systemDesignId} not found`);

    const sunroofHourlyProduction = await this.sunroofHourlyProductionCalculationService.calculateClippingSunroofProduction(
      foundSystemDesign,
      foundSystemProduction,
    );

    return sunroofHourlyProduction;
  }

  async getBatteryChargingSeries(systemDesignId: ObjectId | string): Promise<IEnergyProfileProduction> {
    let result: number[] = new Array(8760).fill(0);

    try {
      const res = await this.s3Service.getObject(
        this.PINBALL_SIMULATION_BUCKET,
        `${systemDesignId}/batteryChargingSeries`,
      );

      if (res) {
        result = JSON.parse(res);
      }
    } catch (_) {
      // Do not thing, any error, such as NoSuchKey (file not found)
    }

    return buildMonthlyAndAnnuallyDataFrom8760(result);
  }

  async getBatteryDischargingSeries(systemDesignId: ObjectId | string): Promise<IEnergyProfileProduction> {
    let result: number[] = new Array(8760).fill(0);
    try {
      const res = await this.s3Service.getObject(
        this.PINBALL_SIMULATION_BUCKET,
        `${systemDesignId}/batteryDischargingSeries`,
      );

      if (res) {
        result = JSON.parse(res);
      }
    } catch (_) {
      // Do not thing, any error, such as NoSuchKey (file not found)
    }

    return buildMonthlyAndAnnuallyDataFrom8760(result);
  }

  async getBatteryDataSeriesForTypicalDay(
    systemDesignId: ObjectId | string,
  ): Promise<{
    batteryChargingSeries: IEnergyProfileProduction;
    batteryDischargingSeries: IEnergyProfileProduction;
  }> {
    let rateAmountHourly: IPinballRateAmount[] = new Array(8760).fill({ rate: 0, charge: false });
    try {
      const res = await this.s3Service.getObject(this.PINBALL_SIMULATION_BUCKET, `${systemDesignId}/rateAmountHourly`);

      if (res) {
        rateAmountHourly = JSON.parse(res);
      }
    } catch (_) {
      // Do not thing, any error, such as NoSuchKey (file not found)
    }

    const {
      hourlyPostInstallLoadInWh,
      hourlySeriesForExistingPVInWh,
      hourlySeriesForNewPVInWh,
      batterySystemSpecs,
    } = await this.prepareProductionDataForPinballSimulation(systemDesignId);

    const monthlyAndAnnualPostInstallLoadInWhIn24Hours = getMonthlyAndAnnualWeekdayAverageFrom8760(
      hourlyPostInstallLoadInWh,
    );
    const monthlyAndAnnualSeriesForExistingPVInWhIn24Hours = getMonthlyAndAnnualAverageFrom8760(
      hourlySeriesForExistingPVInWh,
    );
    const monthlyAndAnnualSeriesForNewPVInWhIn24Hours = getMonthlyAndAnnualAverageFrom8760(hourlySeriesForNewPVInWh);
    const monthlyAndAnnualRateAmountIn24Hours = getMonthlyAndAnnualRateAmountFrom8760(rateAmountHourly);

    const ratingInKW = batterySystemSpecs.totalRatingInKW * 1000;
    const minimumReserveInKW = (batterySystemSpecs.totalCapacityInKWh * 1000 * batterySystemSpecs.minimumReserve) / 100;
    const sqrtRoundTripEfficiency = Math.sqrt(batterySystemSpecs.roundTripEfficiency / 100);

    let batteryChargingSeries: IEnergyProfileProduction = {
      annualAverage: [],
      monthlyAverage: [],
    };

    let batteryDischargingSeries: IEnergyProfileProduction = {
      annualAverage: [],
      monthlyAverage: [],
    };

    const annualPinballData = this.utilityService.caculatePinballDataIn24Hours(
      monthlyAndAnnualPostInstallLoadInWhIn24Hours.annualAverage,
      monthlyAndAnnualSeriesForExistingPVInWhIn24Hours.annualAverage,
      monthlyAndAnnualSeriesForNewPVInWhIn24Hours.annualAverage,
      monthlyAndAnnualRateAmountIn24Hours.annualRateAmount,
      batterySystemSpecs,
      ratingInKW,
      minimumReserveInKW,
      sqrtRoundTripEfficiency,
    );

    batteryChargingSeries.annualAverage = annualPinballData.batteryChargingSeriesIn24Hours;
    batteryDischargingSeries.annualAverage = annualPinballData.batteryDischargingSeriesIn24Hours;

    for (let i = 0; i < 12; i++) {
      const monthlyPinballData = this.utilityService.caculatePinballDataIn24Hours(
        monthlyAndAnnualPostInstallLoadInWhIn24Hours.monthlyAverage[i],
        monthlyAndAnnualSeriesForExistingPVInWhIn24Hours.monthlyAverage[i],
        monthlyAndAnnualSeriesForNewPVInWhIn24Hours.monthlyAverage[i],
        monthlyAndAnnualRateAmountIn24Hours.monthlyRateAmount[i],
        batterySystemSpecs,
        ratingInKW,
        minimumReserveInKW,
        sqrtRoundTripEfficiency,
      );
      batteryChargingSeries.monthlyAverage.push(monthlyPinballData.batteryChargingSeriesIn24Hours);
      batteryDischargingSeries.monthlyAverage.push(monthlyPinballData.batteryDischargingSeriesIn24Hours);
    }

    batteryChargingSeries = buildMonthlyAndAnnuallyDataFrom24HoursData(batteryChargingSeries);
    batteryDischargingSeries = buildMonthlyAndAnnuallyDataFrom24HoursData(batteryDischargingSeries);

    return {
      batteryChargingSeries,
      batteryDischargingSeries,
    };
  }

  async getExistingSystemProductionSeries(opportunityId: string): Promise<IEnergyProfileProduction> {
    const existingSystemProduction = await this.utilityService.getExistingSystemProductionByOpportunityId(
      opportunityId,
      true,
    );

    return buildMonthlyAndAnnuallyDataFrom8760(existingSystemProduction.hourlyProduction);
  }

  async prepareProductionDataForPinballSimulation(
    systemDesignId: ObjectId | string,
  ): Promise<{
    hourlyPostInstallLoadInWh: number[];
    hourlySeriesForExistingPVInWh: number[];
    hourlySeriesForNewPVInWh: number[];
    batterySystemSpecs: BatterySystemSpecsDto;
  }> {
    const systemDesign = await this.systemDesignService.getOneById(systemDesignId);

    if (!systemDesign) {
      throw new NotFoundException(`System design with id ${systemDesignId} not found`);
    }

    const [sunroofProduction, systemProduction] = await Promise.all([
      this.googleSunroofService.calculateProduction(systemDesign),
      this.systemProductionService.findOne(systemDesign.systemProductionId),
    ]);

    if (!systemProduction) {
      throw new NotFoundException(`System production with id ${systemDesign.systemProductionId} not found`);
    }

    const cumulativeGenerationKWh = sunroofProduction.annualProduction;
    const { capacityKW, annualUsageKWh } = systemProduction;

    systemProduction.generationKWh = cumulativeGenerationKWh;
    systemProduction.productivity = capacityKW === 0 ? 0 : cumulativeGenerationKWh / capacityKW;
    systemProduction.offsetPercentage = annualUsageKWh > 0 ? cumulativeGenerationKWh / annualUsageKWh : 0;
    systemProduction.generationMonthlyKWh = sunroofProduction.monthlyProduction;
    systemProduction.arrayGenerationKWh = sunroofProduction.byArray.map(array => array.annualProduction);

    const [utility, existingSystemProduction, systemProductionArray] = await Promise.all([
      this.utilityService.getUtilityByOpportunityId(systemDesign.opportunityId),
      this.utilityService.getExistingSystemProductionByOpportunityId(systemDesign.opportunityId, true),
      this.systemProductService.calculateSystemProductionByHour(systemDesign),
    ]);

    if (!utility) {
      throw ApplicationException.EntityNotFound(systemDesign.opportunityId);
    }

    const hourlyPostInstallLoadInKWh = this.utilityService.getHourlyEstimatedUsage(utility);

    const hourlySeriesForNewPVInKWh = this.utilityService.calculate8760OnActualMonthlyUsage(
      systemProductionArray.hourly,
      systemProduction.generationMonthlyKWh,
    ) as number[];

    const hourlySeriesForNewPVInWh: number[] = [];
    const hourlyPostInstallLoadInWh: number[] = [];
    const hourlySeriesForExistingPVInWh = existingSystemProduction.hourlyProduction;

    const maxLength = Math.max(hourlySeriesForNewPVInKWh.length, hourlyPostInstallLoadInKWh.length);

    for (let i = 0; i < maxLength; i += 1) {
      if (hourlySeriesForNewPVInKWh[i]) {
        hourlySeriesForNewPVInWh[i] = hourlySeriesForNewPVInKWh[i] * 1000;
      }

      if (hourlyPostInstallLoadInKWh[i]) {
        hourlyPostInstallLoadInWh[i] = hourlyPostInstallLoadInKWh[i] * 1000;
      }
    }

    const { storage } = systemDesign.roofTopDesignData;

    const batterySystemSpecs = {
      totalRatingInKW: sumBy(storage, item => item.storageModelDataSnapshot.ratings.kilowatts || 0),
      totalCapacityInKWh: sumBy(storage, item => item.storageModelDataSnapshot.ratings.kilowattHours || 0),
      roundTripEfficiency: storage[0]?.roundTripEfficiency || 0,
      minimumReserve:
        storage[0]?.purpose === BATTERY_PURPOSE.BACKUP_POWER
          ? storage[0]?.reservePercentage
          : sumBy(storage, item => item.reservePercentage || 0) / storage.length || 0,
      operationMode: storage[0]?.purpose || BATTERY_PURPOSE.PV_SELF_CONSUMPTION,
    };

    return {
      hourlyPostInstallLoadInWh,
      hourlySeriesForExistingPVInWh,
      hourlySeriesForNewPVInWh,
      batterySystemSpecs,
    };
  }

  async getNetLoadAverage(systemDesignId: ObjectId | string): Promise<IEnergyProfileProduction> {
    let result: number[] = new Array(8760).fill(0);

    try {
      const res = await this.s3Service.getObject(
        this.PINBALL_SIMULATION_BUCKET,
        `${systemDesignId}/postInstallSiteDemandSeries`,
      );

      if (res) {
        result = JSON.parse(res);
      }
    } catch (_) {
      // Do not thing, any error, such as NoSuchKey (file not found)
    }

    return buildMonthlyAndAnnuallyDataFrom8760(result);
  }
}

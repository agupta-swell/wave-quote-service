/* eslint-disable no-plusplus */
import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { ApplicationException } from 'src/app/app.exception';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { PvWattProductionDto } from 'src/system-productions/res';
import { IEnergyProfileProduction } from 'src/system-productions/system-production.schema';
import { CHARGING_LOGIC_TYPE } from 'src/utilities/constants';
import {
  calculateElectricVehicle,
  calculatePlannedUsageIncreasesKwh,
  calculatePoolUsageKwh,
} from 'src/utilities/operators';
import { GetPinballSimulatorDto } from 'src/utilities/req';
import { IPinballRateAmount } from 'src/utilities/utility.interface';
import { UtilityService } from 'src/utilities/utility.service';
import {
  buildMonthlyAndAnnualDataFrom24HoursData,
  buildMonthlyAndAnnualDataFrom8760,
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
    private readonly s3Service: S3Service,
    @Inject(forwardRef(() => UtilityService))
    private readonly utilityService: UtilityService,
  ) {}

  async getPvWattProduction(systemDesignId: ObjectId): Promise<PvWattProductionDto | undefined> {
    const systemDesign = await this.systemDesignService.getDetails(systemDesignId);
    return systemDesign.data?.systemProductionData.pvWattProduction;
  }

  async getExpectedUsage(opportunityId: string): Promise<IEnergyProfileProduction> {
    const utilityUsageDetailData = await this.utilityService.getUtilityByOpportunityId(opportunityId);

    if (!utilityUsageDetailData) {
      throw new NotFoundException(`Utility and Usage detail is not found with this opportunity id ${opportunityId}`);
    }

    if (utilityUsageDetailData.plannedProfile) {
      return buildMonthlyAndAnnualDataFrom8760(utilityUsageDetailData.plannedProfile.hourlyUsage.map(v => v * 1000)); // convert to Wh
    }

    const { usage } = await this.utilityService
      .getTypicalUsage$(opportunityId)
      .pipe(
        mergeMap(res =>
          of(res).pipe(calculatePlannedUsageIncreasesKwh, calculatePoolUsageKwh, calculateElectricVehicle),
        ),
      )
      .toPromise();

    const [annualUsage, ...monthlyUsage] = usage;

    return { annualAverage: annualUsage, monthlyAverage: monthlyUsage };
  }

  async getSunroofHourlyProduction(systemDesignId: ObjectId | string): Promise<IEnergyProfileProduction> {
    const systemActualProduction8760 = await this.systemDesignService.getSystemActualProduction(systemDesignId);

    return buildMonthlyAndAnnualDataFrom8760(systemActualProduction8760.map(x => x * 1000)); // convert to Wh
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

    return buildMonthlyAndAnnualDataFrom8760(result);
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

    return buildMonthlyAndAnnualDataFrom8760(result);
  }

  async getBatteryDataSeriesForTypicalDay(
    systemDesignId: ObjectId | string,
  ): Promise<{
    batteryChargingSeries: IEnergyProfileProduction;
    batteryDischargingSeries: IEnergyProfileProduction;
  }> {
    const filenames = [`${systemDesignId}/rateAmountHourly`, `${systemDesignId}/inputs`];

    const [cachedRateAmountHourlyDataFromS3, cachedPinballInputDataFromS3]: (
      | string
      | undefined
    )[] = await this.s3Service.getObjects(this.PINBALL_SIMULATION_BUCKET, filenames);

    const rateAmountHourly: IPinballRateAmount[] = cachedRateAmountHourlyDataFromS3
      ? JSON.parse(cachedRateAmountHourlyDataFromS3)
      : new Array(8760).fill({ rate: 0, shouldCharge: false, shouldDischarge: false });

    // check if pinballInputData did not save to S3 => recalculate
    const pinballInputData = cachedPinballInputDataFromS3
      ? JSON.parse(cachedPinballInputDataFromS3)
      : await this.prepareDataForTypicalView(systemDesignId);

    const systemDesign = await this.systemDesignService.getOneById(systemDesignId);

    if (!systemDesign) {
      throw new NotFoundException(`System design with id ${systemDesignId} not found`);
    }

    // get save pinballChargingLogicType
    const pinballChargingLogicType = systemDesign.pinballChargingLogicType;

    // check if null result when recalculating => system does not have solar array
    if (!pinballInputData) {
      const noneSolarBatteryDataSeries: IEnergyProfileProduction = buildMonthlyAndAnnualDataFrom8760(
        Array(8760).fill(0),
      );
      return {
        batteryChargingSeries: noneSolarBatteryDataSeries,
        batteryDischargingSeries: noneSolarBatteryDataSeries,
      };
    }

    // all data is in Wh
    const {
      hourlyPostInstallLoad,
      hourlySeriesForTotalPV,
      hourlySeriesForNewPV,
      batterySystemSpecs,
    } = pinballInputData;

    const monthlyAndAnnualPostInstallLoadInWhIn24Hours = getMonthlyAndAnnualWeekdayAverageFrom8760(
      hourlyPostInstallLoad,
    );

    // handle backward compatibility
    const monthlyAndAnnualSeriesForTotalPVInWhIn24Hours = getMonthlyAndAnnualAverageFrom8760(
      hourlySeriesForTotalPV || hourlySeriesForNewPV,
    );

    let monthlyAndAnnualRateAmountIn24Hours;

    if (pinballChargingLogicType === CHARGING_LOGIC_TYPE.NEM3) {
      rateAmountHourly.forEach(hourly => {
        hourly.shouldCharge = false;
        hourly.shouldDischarge = false;
      });

      // NEM2 charging logic
      const rateAmountHourlyForNEM2 = this.utilityService.buildNEM2ChargingLogic(rateAmountHourly);

      monthlyAndAnnualRateAmountIn24Hours = getMonthlyAndAnnualRateAmountFrom8760(rateAmountHourlyForNEM2);

      // apply NEM3 charging logic for typical day
      // annual
      monthlyAndAnnualRateAmountIn24Hours.annualRateAmount = this.utilityService.buildNEM3ChargingLogic(
        monthlyAndAnnualRateAmountIn24Hours.annualRateAmount,
        monthlyAndAnnualSeriesForTotalPVInWhIn24Hours.annualAverage,
        monthlyAndAnnualPostInstallLoadInWhIn24Hours.annualAverage,
      );
      // monthly
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        monthlyAndAnnualRateAmountIn24Hours.monthlyRateAmount[monthIndex] = this.utilityService.buildNEM3ChargingLogic(
          monthlyAndAnnualRateAmountIn24Hours.monthlyRateAmount[monthIndex],
          monthlyAndAnnualSeriesForTotalPVInWhIn24Hours.monthlyAverage[monthIndex],
          monthlyAndAnnualPostInstallLoadInWhIn24Hours.monthlyAverage[monthIndex],
        );
      }
    } else if (!rateAmountHourly[0].shouldCharge && !rateAmountHourly[0].shouldDischarge) {
      // check if rateAmountHourly in old format
      const updatedRateAmountHourly = rateAmountHourly.map(hourly => {
        const { rate, charge } = hourly as any;
        return { rate, shouldCharge: charge, shouldDischarge: !charge };
      });

      // save to s3
      this.s3Service.putObject(
        this.PINBALL_SIMULATION_BUCKET,
        `${systemDesignId}/rateAmountHourly`,
        JSON.stringify(updatedRateAmountHourly),
        'application/json; charset=utf-8',
      );

      monthlyAndAnnualRateAmountIn24Hours = getMonthlyAndAnnualRateAmountFrom8760(updatedRateAmountHourly);
    } else {
      monthlyAndAnnualRateAmountIn24Hours = getMonthlyAndAnnualRateAmountFrom8760(rateAmountHourly);
    }

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

    const annualPinballData = this.utilityService.calculatePinballDataIn24Hours(
      monthlyAndAnnualPostInstallLoadInWhIn24Hours.annualAverage,
      monthlyAndAnnualSeriesForTotalPVInWhIn24Hours.annualAverage,
      monthlyAndAnnualRateAmountIn24Hours.annualRateAmount,
      batterySystemSpecs,
      ratingInKW,
      minimumReserveInKW,
      sqrtRoundTripEfficiency,
      [],
      pinballChargingLogicType,
    );

    batteryChargingSeries.annualAverage = annualPinballData.batteryChargingSeriesIn24Hours;
    batteryDischargingSeries.annualAverage = annualPinballData.batteryDischargingSeriesIn24Hours;

    for (let i = 0; i < 12; i++) {
      const monthlyPinballData = this.utilityService.calculatePinballDataIn24Hours(
        monthlyAndAnnualPostInstallLoadInWhIn24Hours.monthlyAverage[i],
        monthlyAndAnnualSeriesForTotalPVInWhIn24Hours.monthlyAverage[i],
        monthlyAndAnnualRateAmountIn24Hours.monthlyRateAmount[i],
        batterySystemSpecs,
        ratingInKW,
        minimumReserveInKW,
        sqrtRoundTripEfficiency,
        [],
        pinballChargingLogicType,
      );
      batteryChargingSeries.monthlyAverage.push(monthlyPinballData.batteryChargingSeriesIn24Hours);
      batteryDischargingSeries.monthlyAverage.push(monthlyPinballData.batteryDischargingSeriesIn24Hours);
    }

    batteryChargingSeries = buildMonthlyAndAnnualDataFrom24HoursData(batteryChargingSeries);
    batteryDischargingSeries = buildMonthlyAndAnnualDataFrom24HoursData(batteryDischargingSeries);

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

    return buildMonthlyAndAnnualDataFrom8760(existingSystemProduction.hourlyProduction);
  }

  async prepareDataForTypicalView(systemDesignId: ObjectId | string): Promise<GetPinballSimulatorDto | null> {
    const systemDesign = await this.systemDesignService.getOneById(systemDesignId);

    if (!systemDesign) {
      throw new NotFoundException(`System design with id ${systemDesignId} not found`);
    }

    // check if system design does not have panel array, so does not need SIMULATE PINBALL
    if (!systemDesign.roofTopDesignData?.panelArray.length) {
      return null;
    }

    const utility = await this.utilityService.getUtilityByOpportunityId(systemDesign.opportunityId);

    if (!utility) {
      throw ApplicationException.EntityNotFound(systemDesign.opportunityId);
    }

    const systemActualProduction8760 = await this.systemDesignService.getSystemActualProduction(systemDesignId);

    const pinballInputData = await this.systemDesignService.buildPinballInputData(
      systemDesign,
      systemActualProduction8760,
      utility,
    );

    return pinballInputData;
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

    return buildMonthlyAndAnnualDataFrom8760(result);
  }
}

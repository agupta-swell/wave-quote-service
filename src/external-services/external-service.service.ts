import { forwardRef, Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as dayjs from 'dayjs';
import { ECommerceService } from 'src/e-commerces/e-commerce.service';
import { REGION_PURPOSE } from 'src/e-commerces/schemas';
import { TypicalBaselineParamsDto } from 'src/utilities/req/sub-dto/typical-baseline-params.dto';
import { getNextYearDateRange } from 'src/utils/datetime';
import { ApplicationException } from '../app/app.exception';
import { MyLogger } from '../app/my-logger/my-logger.service';
import { IFniProcessReq } from '../qualifications/typing';
import { GenabilityService } from './sub-services/genability.service';
import {
  EGenabilityDetailLevel,
  EGenabilityGroupBy,
  IAnnualBillData,
  ICalculateAnnualBillPayload,
  ICalculateCostPayload,
  ICalculateSystemProduction,
  IGenabilityCalculateUtilityCost,
  ILoadServingEntity,
  IPvWattV8Responses,
  ITypicalBaseLine,
  ITypicalUsage,
} from './typing';

@Injectable()
export class ExternalService {
  constructor(
    private readonly logger: MyLogger,
    private readonly genabilityService: GenabilityService,
    @Inject(forwardRef(() => ECommerceService))
    private readonly eCommerceService: ECommerceService,
  ) {}

  async calculateSystemProduction(
    {
      lat,
      lon,
      systemCapacity,
      azimuth,
      tilt = 0,
      losses = 0,
      monthlySolarAccessValue,
    }: ICalculateSystemProduction,
    opportunityId?: string
  ): Promise<IPvWattV8Responses> {
    const url = 'https://developer.nrel.gov/api/pvwatts/v8.json';
    const apiKey = 'Jfd68KJSvs2xJCe2zrFz8muiVLKh9G25CayoZSND';
    
    let soiling, soilingLosses, snowLosses;
    if(opportunityId) {
      // acquire our known durate values and calculate agains the provided monthlySolarAccessValues
      [soilingLosses, snowLosses] = await Promise.all([
        this.eCommerceService.getEnvironmentalLosses(opportunityId, REGION_PURPOSE.SOILING),
        this.eCommerceService.getEnvironmentalLosses(opportunityId, REGION_PURPOSE.SNOW),
      ]);
      soiling = monthlySolarAccessValue?.map((v, index) => {
        const soilingLoss = soilingLosses?.amounts[index];
        const snowLoss = snowLosses?.amounts[index];
        const result = (
          1 - parseFloat(
            (
              (
                (100 - soilingLoss)/100
                *
                (100 - snowLoss)/100
                *
                v/100
              )
            ).toFixed(2) // factor to 2 decimal places
          ) // subtract from 1 to get decimal pecentage of complete deration
        ) * 100; // turn complete duration in a percentage value that PVWatt can use
        return parseInt(result.toFixed(0));
      });
    } else {
      // This area of the code is hit when evaluating worst case vs. best case
      // solar solutions. Send default value of 3.
      soiling = Array.from({length: 12}).fill(3) as number[] 
    }

    let systemProduction: any;
    const params = {
      lat,
      lon,
      system_capacity: systemCapacity,
      azimuth,
      tilt,
      losses,
      module_type: 1,
      array_type: 1,
      timeframe: 'hourly',
      soiling: soiling?.join('|'),
    };
    try {
      this.logger.log("Start call to PVWatt");
      systemProduction = await axios.get(url, {
        params,
        headers: {
          'X-Api-Key': apiKey,
        },
      });
    } catch (error) {
      this.logger.errorAPICalling(url, error.message);
      throw ApplicationException.ServiceError();
    }
    this.logger.log(`Completed call to PVWatts with params: ${JSON.stringify(params, undefined, 2)}` );
    return systemProduction.data.outputs;
  }

  async getLoadServingEntities(zipCode: number): Promise<ILoadServingEntity[]> {
    return this.genabilityService.getLoadServingEntitiesData(zipCode);
  }

  calculateMonthlyUsage = (data: { i: number; v: number }[]) => {
    const typicalMonthlyUsage: any[] = [];
    let month = 1;
    let i = 0;
    const totalkWhMonthly = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
      10: 0,
      11: 0,
      12: 0,
    };

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

    while (i < data.length) {
      totalkWhMonthly[month] += data[i].v;
      if (data[i].i === condition[month]) {
        typicalMonthlyUsage.push({ i: month, v: totalkWhMonthly[month] });
        month += 1;
      }
      i += 1;
    }

    return typicalMonthlyUsage as ITypicalUsage[];
  };

  async getTypicalBaseLine(typicalBaselineParams: TypicalBaselineParamsDto): Promise<ITypicalBaseLine> {
    const { measures, ...result } = await this.genabilityService.getTypicalBaseLineData(typicalBaselineParams);
    const typicalMonthlyUsage = this.calculateMonthlyUsage(measures);

    const entity = {
      ...result,
      zipCode: typicalBaselineParams.zipCode,
      typicalHourlyUsage: measures,
      typicalMonthlyUsage,
    };

    return entity;
  }

  async getTariffsByMasterTariffId(masterTariffId: string) {
    return this.genabilityService.getTariffsByMasterTariffIdData(masterTariffId);
  }

  async getTariff(zipCode: number, lseId?: number) {
    const params = {
      zipCode,
      populateProperties: true,
      isActive: true,
      customerClasses: 'RESIDENTIAL,SPECIAL_USE',
      pageCount: 100,
    };

    if (lseId) {
      // eslint-disable-next-line dot-notation
      params['lseId'] = lseId;
    }

    const { count: total, results } = await this.genabilityService.getTariffData(params);

    if (total > params.pageCount) {
      const remain = Math.ceil(total / params.pageCount) - 1;

      const batches = await Promise.all(
        Array.from({ length: remain }, (_, idx) =>
          this.genabilityService.getTariffData({ ...params, pageStart: (idx + 1) * params.pageCount }),
        ),
      );

      const batchResults = batches.reduce((acc, cur) => {
        acc = [...acc, ...cur.results];
        return acc;
      }, results);

      return batchResults;
    }

    return results || [];
  }

  async calculateCost({
    hourlyDataForTheYear,
    masterTariffId,
    groupBy,
    detailLevel,
    billingPeriod,
    zipCode,
    startDate,
    medicalBaselineAmount,
    isLowIncomeOrDac,
  }: IGenabilityCalculateUtilityCost): Promise<any> {
    const { fromDateTime, toDateTime } = getNextYearDateRange(startDate);

    const from8760Index = dayjs(fromDateTime).diff(dayjs(fromDateTime).startOf('year'), 'day') * 24;

    const netDataSeries: number[] = [
      ...hourlyDataForTheYear.slice(from8760Index, 8760),
      ...hourlyDataForTheYear.slice(0, from8760Index),
    ];

    // decompose netDataSeries into import and export series
    // imported energy is only positive net load numbers
    let importDataSeries = netDataSeries.map(kWh => (kWh > 0 ? kWh : 0));

    // exported energy is only negative net load numbers
    // but Genability expects positive (absolute) values
    let exportDataSeries = netDataSeries.map(kWh => (kWh < 0 ? Math.abs(kWh) : 0));

    // WAV-3230 Apply ~7% correction to adjustment for NEM3 tariffs
    const totalTimesteps = netDataSeries.length;
    const totalExport = exportDataSeries.filter(kWh => kWh > 0).reduce((accum, curVal) => accum + curVal, 0);
    const CORRECTION_PERCENT = 0.068;
    const delta = totalExport * CORRECTION_PERCENT;
    const correction = delta / totalTimesteps;

    const addCorrection = dataSeries => dataSeries.map(kWh => kWh + correction);

    importDataSeries = addCorrection(importDataSeries);
    exportDataSeries = addCorrection(exportDataSeries);

    const payload: ICalculateCostPayload = {
      address: {
        country: 'USA',
        zip: zipCode,
      },
      fromDateTime,
      toDateTime,
      masterTariffId,
      groupBy: groupBy || EGenabilityGroupBy.DAY,
      detailLevel: detailLevel || EGenabilityDetailLevel.RATE,
      billingPeriod: billingPeriod ?? true,
      minimums: true,
      propertyInputs: [
        {
          keyName: 'consumption',
          fromDateTime,
          duration: 3600000,
          unit: 'kWh',
          dataSeries: importDataSeries,
          exportDataSeries,
        },
      ],
    };
    if (medicalBaselineAmount) {
      payload.propertyInputs.push({
        keyName: 'dailyMedicalAllowance',
        dataValue: medicalBaselineAmount.toString(),
      });
    }

    if (isLowIncomeOrDac) {
      payload.propertyInputs.push({
        keyName: 'accPlusAdderCustomerType',
        dataValue: 'lowIncome',
      });
    }

    return this.genabilityService.calculateCostData(payload);
  }

  getFniResponse = (data: IFniProcessReq, url?: string): Promise<any> =>
    new Promise((resolve, reject) => {
      axios
        .post(url || (process.env.FNI_END_POINT as string), data)
        .then(result => {
          resolve(result.data);
        })
        .catch(error => {
          if (error) {
            // Done this way so we do not accidentally expose private keys
            const req: any = {};
            if ((data as IFniProcessReq)?.transaction?.refnum) {
              req.refnum = (data as IFniProcessReq)?.transaction?.refnum;
            }
            console.log('Error with getFniResponse', req, error);
            reject(error);
          }
        });
    });

  /**
   * Calculate annual bill from Genability response
   */
  async calculateAnnualBill(data: ICalculateAnnualBillPayload): Promise<IAnnualBillData> {
    const { hourlyDataForTheYear, masterTariffId, zipCode, medicalBaselineAmount, startDate, isLowIncomeOrDac } = data;
    // Call Genability
    const [result] = await this.calculateCost({
      hourlyDataForTheYear,
      masterTariffId,
      groupBy: EGenabilityGroupBy.MONTH,
      detailLevel: EGenabilityDetailLevel.CHARGE_TYPE,
      billingPeriod: false,
      zipCode: zipCode.toString(),
      startDate,
      medicalBaselineAmount,
      isLowIncomeOrDac,
    });

    const { fromDateTime, toDateTime } = result;

    // Calculate annual bill
    const { adjustedTotalCost, kWh } = result.summary;
    const consumptionCosts = result.items
      .filter(item => item.quantityKey === 'consumption')
      .reduce((accumulator, currentValue) => accumulator + currentValue.cost, 0);

    const annualCost = consumptionCosts < 0 ? adjustedTotalCost - consumptionCosts + kWh * 0.05 : adjustedTotalCost;

    return {
      annualCost,
      fromDateTime,
      toDateTime,
    };
  }
}

import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as dayjs from 'dayjs';
import { getNextYearDateRange } from 'src/utils/datetime';
import { TypicalBaselineParamsDto } from 'src/utilities/req/sub-dto/typical-baseline-params.dto';
import { ApplicationException } from '../app/app.exception';
import { MyLogger } from '../app/my-logger/my-logger.service';
import { IApplyRequest } from '../qualifications/typing';
import {
  EGenabilityDetailLevel,
  EGenabilityGroupBy,
  ICalculateSystemProduction,
  IGenabilityCalculateUtilityCost,
  ILoadServingEntity,
  IPvWattV6Responses,
  ITypicalBaseLine,
  ITypicalUsage,
} from './typing';

@Injectable()
export class ExternalService {
  private genabilityToken: string;

  constructor(private readonly logger: MyLogger) {
    this.genabilityToken = this.getGenabilityToken();
  }

  async calculateSystemProduction({
    lat,
    lon,
    systemCapacity,
    azimuth,
    tilt = 0,
    losses = 0,
  }: ICalculateSystemProduction): Promise<IPvWattV6Responses> {
    const url = 'https://developer.nrel.gov/api/pvwatts/v6.json';
    const apiKey = 'Jfd68KJSvs2xJCe2zrFz8muiVLKh9G25CayoZSND';

    let systemProduction: any;
    try {
      systemProduction = await axios.get(url, {
        params: {
          lat,
          lon,
          system_capacity: systemCapacity,
          azimuth,
          tilt,
          losses,
          module_type: 1,
          array_type: 1,
          timeframe: 'hourly',
        },
        headers: {
          'X-Api-Key': apiKey,
        },
      });
    } catch (error) {
      this.logger.errorAPICalling(url, error.message);
      throw ApplicationException.ServiceError();
    }
    return systemProduction.data.outputs;
  }

  async getLoadServingEntities(zipCode: number): Promise<ILoadServingEntity[]> {
    const url = 'https://api.genability.com/rest/public';
    let result: any;

    try {
      result = await axios.get(
        `${url}/lses?zipCode=${zipCode}&country=US&residentialServiceTypes=ELECTRICITY&fields=ext`,
        {
          headers: {
            Authorization: this.genabilityToken,
          },
        },
      );
    } catch (error) {
      this.logger.errorAPICalling(url, error.message);
      throw ApplicationException.ServiceError();
    }
    // The actual response:
    // data: {
    //   status: 'success',
    //   count: 3,
    //   type: 'LoadServingEntity',
    //   results: [ [Object], [Object], [Object] ],
    //   pageCount: 25,
    //   pageStart: 0
    // }
    // TODO: implement pagination
    const loadServingEntities = result.data.results.map(lse => ({
      zipCode,
      lseName: lse.name,
      lseCode: lse.lseCode,
      serviceType: lse.serviceTypes,
      lseId: `${lse.lseId}`,
    }));
    return loadServingEntities;
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
    // Docs: https://developer.genability.com/api-reference/shared-api/typical-baseline/#get-best-baseline

    const URL = 'https://api.genability.com/rest/v1/typicals/baselines/best';

    let typicalBaseLine: any;
    try {
      typicalBaseLine = await axios.get(URL, {
        headers: {
          Authorization: this.genabilityToken,
        },
        params: typicalBaselineParams,
      });
    } catch (error) {
      this.logger.errorAPICalling(URL, error.message);
      throw ApplicationException.ServiceError();
    }

    const result = typicalBaseLine.data.results[0];
    const typicalMonthlyUsage = this.calculateMonthlyUsage(result.measures);

    const entity = {
      zipCode: typicalBaselineParams.zipCode,
      buildingType: result.buildingType.id,
      customerClass: result.buildingType.customerClass,
      lseName: result.climateZone.lseName,
      lseId: result.climateZone.lseId,
      sourceType: result.serviceType,
      annualConsumption: result.factors.annualConsumption,
      typicalHourlyUsage: result.measures,
      typicalMonthlyUsage,
    };

    return entity;
  }

  async getTariffsByMasterTariffId(masterTariffId: string) {
    const url = 'https://api.genability.com/rest/public/tariffs';

    try {
      const res = await axios.get(`${url}/${masterTariffId}?populateRates=true`, {
        headers: {
          Authorization: this.genabilityToken,
        },
      });
      return res.data.results || [];
    } catch (error) {
      this.logger.errorAPICalling(url, error.message);
      throw ApplicationException.ServiceError();
    }
  }

  async getTariff(zipCode: number, lseId?: number) {
    const url = 'https://api.genability.com/rest/public/tariffs';
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
    try {
      const res = await axios.get('https://api.genability.com/rest/public/tariffs', {
        headers: {
          Authorization: this.genabilityToken,
        },
        params,
      });

      const total = res.data.count;

      if (total > params.pageCount) {
        const remain = Math.ceil(total / params.pageCount) - 1;

        const batches = await Promise.all(
          Array.from({ length: remain }, (_, idx) =>
            axios.get('https://api.genability.com/rest/public/tariffs', {
              headers: {
                Authorization: this.genabilityToken,
              },
              params: {
                ...params,
                pageStart: (idx + 1) * params.pageCount,
              },
            }),
          ),
        );

        const batchResults = batches.reduce((acc, cur) => {
          acc = [...acc, ...cur.data.results];
          return acc;
        }, res.data.results);

        return batchResults;
      }
      return res.data.results || [];
    } catch (error) {
      this.logger.errorAPICalling(url, error.message);
      throw ApplicationException.ServiceError();
    }
  }

  async calculateCost({
    hourlyDataForTheYear,
    masterTariffId,
    groupBy,
    detailLevel,
    billingPeriod,
    zipCode,
  }: IGenabilityCalculateUtilityCost): Promise<any> {
    const url = 'https://api.genability.com/rest/v1/ondemand/calculate';

    const { fromDateTime, toDateTime } = getNextYearDateRange();

    const from8760Index = dayjs(fromDateTime).diff(dayjs().startOf('year'), 'day') * 24;

    const netDataSeries: number[] = [
      ...hourlyDataForTheYear.slice(from8760Index, 8760),
      ...hourlyDataForTheYear.slice(0, from8760Index),
    ];

    // decompose netDataSeries into import and export series
    const importDataSeries = netDataSeries.map(kWh => {
      // imported energy is only positive net load numbers
      return kWh > 0 ? kWh : 0;
    });
    const exportDataSeries = netDataSeries.map(kWh => {
      // exported energy is only negative net load numbers
      // but Genability expects positive (absolute) values
      return kWh < 0 ? Math.abs(kWh) : 0;
    });

    const payload = {
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

    let tariff: any;
    try {
      tariff = await axios.post(`${url}`, payload, {
        headers: {
          Authorization: this.genabilityToken,
        },
      });
    } catch (error) {
      this.logger.errorAPICalling(url, error.message);
      throw ApplicationException.ServiceError();
    }

    return tariff.data.results;
  }

  getFniResponse = (data: IApplyRequest): Promise<any> =>
    new Promise((resolve, reject) => {
      axios
        .post(process.env.FNI_END_POINT as string, data)
        .then(result => {
          resolve(result.data);
        })
        .catch(error => {
          if (error) {
            console.log('Error when call FNI API in line 232', error);
            reject(error);
          }
        });
    });

  getGenabilityToken(): string {
    const appId = process.env.GENABILITY_APP_ID;
    const appKey = process.env.GENABILITY_APP_KEY;
    const credentials = Buffer.from(`${appId}:${appKey}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Calculate net negative annual usage
   */
  async calculateNetNegativeAnualUsage(postInstall8760: number[], masterTariffId: string, zipCode: number) {
    // Sum the 8760 kWh post-install data series
    const netKwh = postInstall8760.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    // Call Genability
    const [result] = await this.calculateCost({
      hourlyDataForTheYear: postInstall8760,
      masterTariffId,
      groupBy: EGenabilityGroupBy.MONTH,
      detailLevel: EGenabilityDetailLevel.CHARGE_TYPE,
      billingPeriod: false,
      zipCode: zipCode.toString(),
    });

    // Calculate
    const nonBypassableCost = result.summary.nonBypassableCost || 0; // 3313655 - SCE - Domestic Prime TOU return nonBypassableCost
    const fixedCosts = result.items
      .filter(item => item.quantityKey === 'fixed')
      .reduce((accumulator, currentValue) => accumulator + currentValue.cost, 0); // could be negative
    const consumptionCosts = result.items
      .filter(item => item.quantityKey === 'consumption')
      .reduce((accumulator, currentValue) => accumulator + currentValue.cost, 0);

    const annualPostInstallBill =
      fixedCosts + nonBypassableCost + (consumptionCosts > 0 ? consumptionCosts : netKwh * 0.05);

    return annualPostInstallBill;
  }
}

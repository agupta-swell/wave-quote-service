import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ApplicationException } from '../app/app.exception';
import { MyLogger } from '../app/my-logger/my-logger.service';
import { IApplyRequest } from '../qualifications/typing';
import {
  ICalculateSystemProduction,
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

  async getTypicalBaseLine(zipCode: number): Promise<ITypicalBaseLine> {
    // Docs: https://developer.genability.com/api-reference/shared-api/typical-baseline/#get-best-baseline

    const URL = 'https://api.genability.com/rest/v1/typicals/baselines/best';

    let typicalBaseLine: any;
    try {
      typicalBaseLine = await axios.get(URL, {
        headers: {
          Authorization: this.genabilityToken,
        },
        params: {
          addressString: zipCode,
          buildingType: 'singleFamilyDetached',
          excludeMeasures: false,
        },
      });
    } catch (error) {
      this.logger.errorAPICalling(URL, error.message);
      throw ApplicationException.ServiceError();
    }

    const result = typicalBaseLine.data.results[0];
    const typicalMonthlyUsage = this.calculateMonthlyUsage(result.measures);

    const entity = {
      zipCode,
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

  async getTariff(zipCode: number, lseId?: number) {
    const url = 'https://api.genability.com/rest/public/tariffs';
    const params = {
      zipCode,
      populateProperties: true,
      isActive: true,
      customerClasses: 'RESIDENTIAL',
      pageCount: 100,
    };

    if (lseId) {
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

  async calculateCost(hourlyDataForTheYear: number[], masterTariffId: string): Promise<any> {
    const url = 'https://api.genability.com/rest/v1/ondemand/calculate';
    const currentYear = new Date().getFullYear();
    const payload = {
      fromDateTime: `${currentYear - 1}-01-01T00:00:00`,
      toDateTime: `${currentYear}-01-01T00:00:00`,
      masterTariffId,
      groupBy: 'DAY',
      detailLevel: 'RATE',
      billingPeriod: true,
      propertyInputs: [
        {
          keyName: 'consumption',
          fromDateTime: `${currentYear - 1}-01-01T00:00:00`,
          duration: 3600000,
          dataSeries: hourlyDataForTheYear,
          unit: 'kWh',
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
}

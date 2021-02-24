import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ApplicationException } from '../app/app.exception';
import { MyLogger } from '../app/my-logger/my-logger.service';
import { IApplyRequest, IApplyResponse } from '../qualifications/typing';
import {
  ICalculateSystemProduction,
  ILoadServingEntity,
  IPvWattV6Responses,
  ITypicalBaseLine,
  ITypicalUsage
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
      systemProduction = await axios.get(
        `${url}?lat=${lat}&lon=${lon}&system_capacity=${systemCapacity}&azimuth=${azimuth}&tilt=${tilt}&array_type=1&module_type=1&losses=${losses}&timeframe=hourly`,
        {
          headers: {
            'X-Api-Key': apiKey,
          },
        },
      );
    } catch (error) {
      this.logger.errorAPICalling(url, error.message);
      throw ApplicationException.ServiceError();
    }
    return systemProduction.data.outputs;
  }

  async getLoadServingEntity(zipCode: number): Promise<ILoadServingEntity> {
    const url = 'https://api.genability.com/rest/public';
    const token =
      'Basic MmZkOWMwNzUtZWZmYi00M2QyLWI1MWUtNjk1Y2I3NzI2ODk3OmZlMzk1NzZmLTExM2ItNGViZC05ZDU4LWM2ZTY5ODgyY2FjMg==';

    let systemProduction: any;
    try {
      systemProduction = await axios.get(
        `${url}/lses?zipCode=${zipCode}&country=US&residentialServiceTypes=ELECTRICITY&fields=ext`,
        {
          headers: {
            Authorization: token,
          },
        },
      );
    } catch (error) {
      this.logger.errorAPICalling(url, error.message);
      throw ApplicationException.ServiceError();
    }

    const enitity = {
      zipCode,
      lseName: systemProduction.data.results[0].name,
      lseCode: systemProduction.data.results[0].lseCode,
      serviceType: systemProduction.data.results[0].serviceTypes,
      lseId: systemProduction.data.results[0].lseId,
    };

    return enitity;
  }

  calculateMonthlyUsage = (data: { i: number; v: number }[]) => {
    const typicalMonthlyUsage = [];
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
        month++;
      }
      i += 1;
    }

    return typicalMonthlyUsage as ITypicalUsage[];
  };

  async getTypicalBaseLine(zipCode: number): Promise<ITypicalBaseLine> {
    const url = 'https://api.genability.com/rest/v1/typicals/baselines/best';

    let typicalBaseLine: any;
    try {
      typicalBaseLine = await axios.get(
        `${url}?addressString=${zipCode}&buildingType=singleFamilyDetached&excludeMeasures=false&sizingKeyName=loadSize&sizingDataValue=12000&sizingUnit=kWh`,
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

    const result = typicalBaseLine.data.results[0];
    const typicalMonthlyUsage = this.calculateMonthlyUsage(result.measures);

    const enitity = {
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

    return enitity;
  }

  async getTariff(zipCode: number, lseId: number) {
    const url = 'https://api.genability.com/rest/public/tariffs';

    let tariff: any;
    try {
      tariff = await axios.get(
        'https://api.genability.com/rest/public/tariffs',
        {
          headers: {
            Authorization: this.genabilityToken,
          },
          params: {
            lseId,
            zipCode,
            populateProperties: true,
            isActive: true,
            customerClasses: "RESIDENTIAL"
          }
        },
      );
    } catch (error) {
      this.logger.errorAPICalling(url, error.message);
      throw ApplicationException.ServiceError();
    }

    return tariff.data.results;
  }

  async calculateCost(hourlyDataForTheYear: number[], masterTariffId: string) {
    const url = 'https://api.genability.com/rest/v1/ondemand/calculate';
    const currentYear = new Date().getFullYear()
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

  // TODO: need to delete when having real api
  getFniResponse(data: IApplyRequest): IApplyResponse {
    const primarySSN = data.applicant1.soc;
    let code: string;

    switch (primarySSN.charAt(0)) {
      case '1':
        code = 'X';
        break;
      case '2':
        code = 'C';
      default:
        code = 'T';
    }

    const obj = {
      transaction: {
        refNum: 'FNI Reference Number',
        status: 'SUCCESS',
      },
      application: {
        code,
        track: 'External Tracking Number',
      },
      applicant1: {
        sightenId: 'Sighten Site UUID',
      },
    } as IApplyResponse;

    return obj;
  }

  getGenabilityToken(): string {
    const appId = process.env.GENABILITY_APP_ID;
    const appKey = process.env.GENABILITY_APP_KEY;
    const credentials = Buffer.from(appId + ':' + appKey).toString('base64');
    return `Basic ${credentials}`;
  }
}

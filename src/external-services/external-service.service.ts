import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { MyLogger } from '../app/my-logger/my-logger.service';
import { ICalculateSystemProduction, ILoadServingEntity, ITypicalBaseLine, ITypicalUsage } from './typing';

@Injectable()
export class ExternalService {
  constructor(private readonly logger: MyLogger) {}

  async calculateSystemProduction({
    lat,
    lon,
    systemCapacity,
    azimuth,
    tilt = 0,
    losses = 0,
  }: ICalculateSystemProduction) {
    const url = 'https://developer.nrel.gov/api/pvwatts/v6.json';
    const apiKey = 'Jfd68KJSvs2xJCe2zrFz8muiVLKh9G25CayoZSND';

    const systemProduction = await axios.get(
      `${url}?lat=${lat}&lon=${lon}&system_capacity=${systemCapacity}&azimuth=${azimuth}&tilt=${tilt}&array_type=1&module_type=1&losses=${losses}&timeframe=hourly`,
      {
        headers: {
          'X-Api-Key': apiKey,
        },
      },
    );

    return systemProduction.data.outputs.ac_annual;
  }

  async getLoadServingEntity(zipCode: number): Promise<ILoadServingEntity> {
    const url = 'https://api.genability.com/rest/public';
    const token =
      'Basic MmZkOWMwNzUtZWZmYi00M2QyLWI1MWUtNjk1Y2I3NzI2ODk3OmZlMzk1NzZmLTExM2ItNGViZC05ZDU4LWM2ZTY5ODgyY2FjMg==';

    const systemProduction = await axios.get(
      `${url}/lses?zipCode=${zipCode}&country=US&residentialServiceTypes=ELECTRICITY&fields=ext`,
      {
        headers: {
          Authorization: token,
        },
      },
    );

    const enitity = {
      zipCode,
      name: systemProduction.data.results[0].name,
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
    const token = 'hello world';

    let typicalBaseLine: AxiosResponse;
    try {
      typicalBaseLine = await axios.get(
        `${url}?addressString=${zipCode}&buildingType=singleFamilyDetached&excludeMeasures=false&sizingKeyName=loadSize&sizingDataValue=12000&sizingUnit=kWh`,
        {
          headers: {
            Authorization: token,
          },
        },
      );
    } catch (error) {
      // this.logger.error(`'111111 ${error}`);
      // typicalBaseLine = error;
    }

    // console.log('>>>>>>>>>>>>>>>>>>>', 'typicalBaseLine', typicalBaseLine);

    const result = typicalBaseLine.data.results[0];
    // const result = typicalBaseLine
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
}

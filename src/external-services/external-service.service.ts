import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface ICalculateSystemProduction {
  lat: number;
  lon: number;
  systemCapacity: number;
  azimuth: number;
  tilt?: number;
  losses?: number;
}

export interface ILoadServingEntity {
  name: string;
  lseCode: string;
  zipCode: number;
  serviceType: string;
  lseId: string;
}

@Injectable()
export class ExternalService {
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
}

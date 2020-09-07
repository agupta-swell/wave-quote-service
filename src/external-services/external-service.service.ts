import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface IcalculateSystemProduction {
  lat: number;
  lon: number;
  systemCapacity: number;
  azimuth: number;
  tilt?: number;
  losses?: number;
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
  }: IcalculateSystemProduction) {
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
}

import { HttpStatus, Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { EHttpMethod, EVendor } from '../api-metrics/api-metrics.schema';
import { ApiMetricsService } from '../api-metrics/api-metrics.service';
import { GoogleSunroofGatewayAxiosException } from './exceptions';
import type { GoogleSunroof } from './types';

// TODO: Remove this makeshift feature flag after the Google Solar migration is complete.
// NOTE: To use the Google Solar API vs the legacy Google Sunroof API, make sure that the USE_GOOGLE_SOLAR and
// GOOGLE_SOLAR_API keys are present in the .env.
const useGoogleSolar = process.env.USE_GOOGLE_SOLAR === 'true' || false;
const GOOGLE_SOLAR_BASE_URL = (useGoogleSolar) ? 'https://solar.googleapis.com/v1/' :
  'https://earthenginesolar.googleapis.com/v1';
const BUILDINGS_FIND_CLOSEST = (useGoogleSolar) ? 'buildingInsights:findClosest' :
  'buildings:findClosest';
const SOLAR_INFO_GET = (useGoogleSolar) ? 'dataLayers:get' :'solarInfo:get';
const GOOGLE_SOLAR_API_KEY = (useGoogleSolar) ? process.env.GOOGLE_SOLAR_API_KEY :
  process.env.GOOGLE_SUNROOF_API_KEY;

/**
 * The Earth Engine Solar API allows users to read details about the solar potential of over 60 million buildings.
 * This includes measurements of the building's roof (e.g., size and tilt/azimuth), energy production for a range of
 * sizes of solar installations, and financial costs and benefits.
 *
 * https://developers.google.com/earth-engine/solar/v1/reference
 */
@Injectable()
export class GoogleSunroofGateway {
  private readonly client: AxiosInstance;

  constructor(private readonly apiMetricsService: ApiMetricsService) {

    if (!GOOGLE_SOLAR_API_KEY) throw new Error('Missing GOOGLE_SUNROOF_API_KEY or GOOGLE_SOLAR_API_KEY environment variable');

    this.client = axios.create({
      baseURL: GOOGLE_SOLAR_BASE_URL,
      params: {
        key: GOOGLE_SOLAR_API_KEY,
      },
    });

    this.bindError();
  }

  private bindError() {
    this.client.interceptors.response.use(
      response => response,
      error => {
        throw new GoogleSunroofGatewayAxiosException(error);
      },
    );
  }

  /**
   * Locates the closest building to a query point.
   * Returns an error with code NOT_FOUND if there are no buildings within approximately 50m of the query point.
   *
   * https://developers.google.com/earth-engine/solar/v1/reference/rest/v1/buildings/findClosest
   *
   * @param {number} latitude
   * @param {number} longitude
   */
  public async findClosestBuilding(latitude: number, longitude: number): Promise<GoogleSunroof.Building> {
    if(!GOOGLE_SOLAR_API_KEY) throw new Error('Missing GOOGLE_SUNROOF_API_KEY or GOOGLE_SOLAR_API_KEY environment variable');
    const params: GoogleSunroof.IFindClosestBuildingParams = {
      'location.latitude': latitude,
      'location.longitude': longitude,
      key: GOOGLE_SOLAR_API_KEY,
    };

    const data = await this.callGoogleSunroofAPI<GoogleSunroof.Building, GoogleSunroof.IFindClosestBuildingParams, any>(
      {
        url: BUILDINGS_FIND_CLOSEST,
        method: EHttpMethod.GET,
        params,
      },
    );

    return data;
  }

  /**
   * Gets solar information for a region surrounding a location.
   * Returns an error with code NOT_FOUND if the location is outside the coverage area.
   *
   * https://developers.google.com/earth-engine/solar/v1/reference/rest/v1/solarInfo/get
   *
   * @param {number} latitude
   * @param {number} longitude
   * @param {number} radiusMeters
   */
  public async getSolarInfo(
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ): Promise<GoogleSunroof.SolarInfo> {
    if (!GOOGLE_SOLAR_API_KEY) throw new Error('Missing GOOGLE_SUNROOF_API_KEY or GOOGLE_SOLAR_API_KEY environment variable');
    
    const params: GoogleSunroof.IGetSolarInfoParams = {
      'location.latitude': latitude,
      'location.longitude': longitude,
      radiusMeters,
      key: GOOGLE_SOLAR_API_KEY,
    };

    const data = await this.callGoogleSunroofAPI<GoogleSunroof.SolarInfo, GoogleSunroof.IGetSolarInfoParams, any>({
      url: SOLAR_INFO_GET,
      method: EHttpMethod.GET,
      params,
    });

    return data;
  }

  async callGoogleSunroofAPI<T, U, K>(requestData: {
    url: string;
    method: EHttpMethod;
    params?: U;
    data?: K;
  }): Promise<T> {
    const { status, data } = await this.client.request<T>(requestData);

    const route = `${GOOGLE_SOLAR_BASE_URL}/${requestData.url}`;

    if (status === HttpStatus.OK) {
      await this.apiMetricsService.updateAPIMetrics({
        vendor: EVendor.GOOGLE_SUNROOF,
        method: requestData.method,
        route,
      });
    }

    return data;
  }
}

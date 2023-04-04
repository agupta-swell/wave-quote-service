import { HttpStatus, Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';

import { ApplicationException } from 'src/app/app.exception';
import { MyLogger } from 'src/app/my-logger/my-logger.service';
import { ApiMetricsService } from 'src/shared/api-metrics/api-metrics.service';
import { TypicalBaselineParamsDto } from 'src/utilities/req/sub-dto/typical-baseline-params.dto';

import { EHttpMethod, EVendor } from 'src/shared/api-metrics/api-metrics.schema';
import {
  IAxiosDataResponse,
  ICalculateCostPayload,
  ILoadServingEntity,
  ILoadServingEntityResponse,
  ITariffParams,
  ITypicalBaseLineData,
  ITypicalBaseLineResponse,
} from '../typing';

@Injectable()
export class GenabilityService {
  private genabilityToken: string;

  constructor(private readonly apiMetricsService: ApiMetricsService, private readonly logger: MyLogger) {
    this.genabilityToken = this.getGenabilityToken();
  }

  async getLoadServingEntitiesData(zipCode: number): Promise<ILoadServingEntity[]> {
    const URL = 'https://api.genability.com/rest/public/lses';

    try {
      const { results } = await this.callAPI({
        route: URL,
        url: `${URL}?zipCode=${zipCode}&country=US&residentialServiceTypes=ELECTRICITY&fields=ext`,
        method: EHttpMethod.GET,
      });

      // TODO: implement pagination
      return (results as ILoadServingEntityResponse[]).map(lse => ({
        zipCode,
        lseName: lse.name,
        lseCode: lse.lseCode,
        serviceType: lse.serviceTypes,
        lseId: `${lse.lseId}`,
      }));
    } catch (error) {
      this.logger.errorAPICalling(URL, error.message);
      throw ApplicationException.ServiceError();
    }
  }

  async getTypicalBaseLineData(typicalBaselineParams: TypicalBaselineParamsDto): Promise<ITypicalBaseLineData> {
    // Docs: https://developer.genability.com/api-reference/shared-api/typical-baseline/#get-best-baseline

    const URL = 'https://api.genability.com/rest/v1/typicals/baselines/best';

    try {
      const { results } = await this.callAPI({
        route: URL,
        url: URL,
        method: EHttpMethod.GET,
        params: typicalBaselineParams,
      });

      const result = results[0] as ITypicalBaseLineResponse;

      return {
        buildingType: result.buildingType.id,
        customerClass: result.buildingType.customerClass,
        lseName: result.climateZone.lseName,
        lseId: result.climateZone.lseId,
        sourceType: result.serviceType,
        annualConsumption: result.factors.annualConsumption,
        measures: result.measures,
      };
    } catch (error) {
      this.logger.errorAPICalling(URL, error.message);
      throw ApplicationException.ServiceError();
    }
  }

  async getTariffsByMasterTariffIdData(masterTariffId: string) {
    const URL = 'https://api.genability.com/rest/public/tariffs';

    try {
      const { results } = await this.callAPI({
        route: URL,
        url: `${URL}/${masterTariffId}?populateRates=true`,
        method: EHttpMethod.GET,
      });

      return results || [];
    } catch (error) {
      this.logger.errorAPICalling(URL, error.message);
      throw ApplicationException.ServiceError();
    }
  }

  async getTariffData(params: ITariffParams): Promise<IAxiosDataResponse> {
    const URL = 'https://api.genability.com/rest/public/tariffs';

    try {
      const { count, results } = await this.callAPI({ route: URL, url: URL, method: EHttpMethod.GET, params });

      return {
        count,
        results,
      };
    } catch (error) {
      this.logger.errorAPICalling(URL, error.message);
      throw ApplicationException.ServiceError();
    }
  }

  async calculateCostData(payload: ICalculateCostPayload) {
    const URL = 'https://api.genability.com/rest/v1/ondemand/calculate';

    try {
      const { results } = await this.callAPI({ route: URL, url: URL, method: EHttpMethod.POST, payload });

      return results;
    } catch (error) {
      this.logger.errorAPICalling(URL, error.message);
      throw ApplicationException.ServiceError();
    }
  }

  async callAPI({
    route,
    url,
    method,
    params,
    payload,
  }: {
    route: string;
    url: string;
    method: EHttpMethod;
    params?: TypicalBaselineParamsDto | ITariffParams;
    payload?: ICalculateCostPayload;
  }): Promise<IAxiosDataResponse> {
    let status: HttpStatus;
    let data: IAxiosDataResponse;

    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: this.genabilityToken,
      },
    };

    if (params) {
      axiosRequestConfig.params = params;
    }

    if (method === EHttpMethod.GET) {
      const { status: responseStatus, data: responseData } = await axios.get<IAxiosDataResponse>(
        url,
        axiosRequestConfig,
      );

      status = responseStatus;
      data = responseData;
    } else {
      const { status: responseStatus, data: responseData } = await axios.post<IAxiosDataResponse>(
        url,
        payload,
        axiosRequestConfig,
      );

      status = responseStatus;
      data = responseData;
    }

    if (status === HttpStatus.OK) {
      await this.apiMetricsService.updateAPIMetrics({ vendor: EVendor.GENABILITY, method, route });
    }

    return data;
  }

  getGenabilityToken(): string {
    const appId = process.env.GENABILITY_APP_ID;
    const appKey = process.env.GENABILITY_APP_KEY;
    const credentials = Buffer.from(`${appId}:${appKey}`).toString('base64');
    return `Basic ${credentials}`;
  }
}

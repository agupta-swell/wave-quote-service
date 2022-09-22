import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { IProductDocument, IUnknownProduct } from 'src/products-v2/interfaces';
import { ProductService } from 'src/products-v2/services';
import { AsyncContextProvider } from 'src/shared/async-context/providers/async-context.provider';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { v4 as uuidv4 } from 'uuid';
import { ExternalService } from '../../external-services/external-service.service';
import { UpdateSystemDesignDto } from '../req';
import { PvWattSystemProduction, PV_WATT_SYSTEM_PRODUCTION } from '../schemas/pv-watt-system-production.schema';
import { INetUsagePostInstallationSchema, SystemDesign } from '../system-design.schema';

interface IPvWatCalculation {
  lat: number;
  lon: number;
  systemCapacity: number;
  azimuth: number;
  tilt?: number;
  losses?: number;
}

interface ICalculatePVProduction {
  latitude: number;
  longitude: number;
  systemCapacityInkWh: number;
  azimuth: number;
  pitch: number;
  losses: number;
  shouldGetHourlyProduction?: boolean;
}
export interface ISystemProduction {
  hourly: number[];
  arrayHourly?: number[][];
  monthly: number[];
  annual: number;
}

@Injectable()
export class SystemProductService implements OnModuleInit {
  private HOURLY_PRODUCTION_BUCKET = process.env.AWS_S3_ARRAY_HOURLY_PRODUCTION as string;

  private readonly logger = new Logger(SystemProductService.name);

  constructor(
    // @ts-ignore
    @InjectModel(PV_WATT_SYSTEM_PRODUCTION) private readonly pvWattSystemProduction: Model<PvWattSystemProduction>,
    private readonly externalService: ExternalService,
    private readonly productService: ProductService,
    private readonly s3Service: S3Service,
    private readonly asyncContext: AsyncContextProvider,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('Ensure pv_watt index');
      await this.ensurePvWattIndex();
      this.logger.log('Done ensure pv_watt index');
    } catch (err) {
      this.logger.error(err);
    }
  }

  async pvWatCalculation(data: IPvWatCalculation): Promise<number> {
    const { systemCapacity, ...p } = data;
    const pvWattSystemProduction = await this.pvWattSystemProduction
      .findOne({
        ...p,
        systemCapacityKW: systemCapacity,
      })
      .select('acAnnualProduction')
      .lean();

    if (pvWattSystemProduction) {
      return pvWattSystemProduction.acAnnualProduction;
    }

    const res = await this.externalService.calculateSystemProduction(data);

    // save hourly to s3 then save only id to pvWattSystemProduction
    const hourlyProductionId = uuidv4();

    this.asyncContext.cache(hourlyProductionId, res.ac);

    this.asyncContext.queue(() => async () => {
      await this.s3Service.putObject(
        this.HOURLY_PRODUCTION_BUCKET,
        hourlyProductionId,
        JSON.stringify(res.ac),
        'application/json; charset=utf-8',
      );
      this.asyncContext.uncache(hourlyProductionId);
    });

    const createdPvWattSystemProduction = new this.pvWattSystemProduction({
      lat: data.lat,
      lon: data.lon,
      systemCapacityKW: data.systemCapacity,
      azimuth: data.azimuth,
      tilt: data.tilt,
      losses: data.losses,
      arrayType: 1,
      moduleType: 1,
      acAnnualHourlyProduction: hourlyProductionId,
      acMonthlyProduction: res.ac_monthly,
      acAnnualProduction: res.ac_annual,
    });

    await createdPvWattSystemProduction.save();
    return res.ac_annual;
  }

  private async getHourlyProduction(
    hourlyId: string,
    lat: number,
    lon: number,
    systemCapacity: number,
    azimuth: number,
    tilt: number,
    losses: number,
  ): Promise<number[]> {
    const cachedHourly = this.asyncContext.get<number[]>(hourlyId);

    if (cachedHourly) return cachedHourly;

    let hourly: number[] = [];

    try {
      const res = await this.s3Service.getObject(this.HOURLY_PRODUCTION_BUCKET, hourlyId);

      if (res) hourly = JSON.parse(res) as number[];
    } catch (_) {
      // do nothing
    }

    if (hourly) return hourly;

    const payload = {
      lat,
      lon,
      systemCapacity,
      azimuth,
      tilt,
      losses,
    } as IPvWatCalculation;

    const res = await this.externalService.calculateSystemProduction(payload);

    this.asyncContext.cache(hourlyId, res.ac);

    this.asyncContext.queue(() => async () => {
      await this.s3Service.putObject(
        this.HOURLY_PRODUCTION_BUCKET,
        hourlyId,
        JSON.stringify(res.ac),
        'application/json; charset=utf-8',
      );

      this.asyncContext.uncache(hourlyId);
    });

    return res.ac;
  }

  async calculatePVProduction(data: ICalculatePVProduction) {
    const { latitude, longitude, systemCapacityInkWh, azimuth, pitch, losses, shouldGetHourlyProduction } = data;
    const arrayProductionData: ISystemProduction = { hourly: [], monthly: [], annual: 0 };

    const pvWattSystemProduction = await this.pvWattSystemProduction
      .findOne({
        lat: latitude,
        lon: longitude,
        systemCapacityKW: systemCapacityInkWh,
        azimuth,
        tilt: pitch,
      })
      .lean();

    // get hourly from s3
    if (pvWattSystemProduction) {
      if (pvWattSystemProduction.acAnnualHourlyProduction && shouldGetHourlyProduction) {
        const hourlyProduction = await this.getHourlyProduction(
          pvWattSystemProduction.acAnnualHourlyProduction,
          latitude,
          longitude,
          systemCapacityInkWh,
          azimuth,
          pitch,
          losses,
        );

        arrayProductionData.hourly = hourlyProduction;
      }
      arrayProductionData.monthly = pvWattSystemProduction.acMonthlyProduction;
      arrayProductionData.annual = pvWattSystemProduction.acAnnualProduction;
      return arrayProductionData;
    }

    const payload = {
      lat: latitude,
      lon: longitude,
      systemCapacity: systemCapacityInkWh,
      azimuth,
      tilt: pitch,
      losses,
    } as IPvWatCalculation;
    const res = await this.externalService.calculateSystemProduction(payload);

    // save hourly to s3 then save only id to pvWattSystemProduction
    const hourlyProductionId = uuidv4();

    this.asyncContext.cache(hourlyProductionId, res.ac);

    this.asyncContext.queue(() => async () => {
      await this.s3Service.putObject(
        this.HOURLY_PRODUCTION_BUCKET,
        hourlyProductionId,
        JSON.stringify(res.ac),
        'application/json; charset=utf-8',
      );
      this.asyncContext.uncache(hourlyProductionId);
    });

    const createdPvWattSystemProduction = new this.pvWattSystemProduction({
      lat: latitude,
      lon: longitude,
      systemCapacityKW: systemCapacityInkWh,
      azimuth,
      tilt: pitch,
      losses,
      array_type: 1,
      module_type: 1,
      acAnnualHourlyProduction: hourlyProductionId,
      acMonthlyProduction: res.ac_monthly,
      acAnnualProduction: res.ac_annual,
    });
    await createdPvWattSystemProduction.save();

    arrayProductionData.annual = res.ac_annual;
    arrayProductionData.monthly = res.ac_monthly;
    arrayProductionData.hourly = res.ac;

    return arrayProductionData;
  }

  async calculateSystemProductionByHour(
    systemDesignDto: UpdateSystemDesignDto | SystemDesign | LeanDocument<SystemDesign>,
    cachedProducts?: LeanDocument<IUnknownProduct>[],
  ): Promise<ISystemProduction> {
    const { latitude, longitude } = systemDesignDto;
    let pvProductionArray: ISystemProduction[] = [
      { hourly: new Array(8760).fill(0), monthly: new Array(12).fill(0), annual: 0, arrayHourly: [] },
    ];

    if (systemDesignDto?.roofTopDesignData?.panelArray?.length) {
      pvProductionArray = await Promise.all(
        systemDesignDto.roofTopDesignData.panelArray.map(async item => {
          const { azimuth, losses, pitch, useSunroof, sunroofPitch, sunroofAzimuth } = item;
          const panelModelData = cachedProducts
            ? (cachedProducts.find(p => p._id?.toString() === item.panelModelId) as LeanDocument<
                IProductDocument<PRODUCT_TYPE.MODULE>
              >)
            : await this.productService.getDetailById(item.panelModelId);
          const systemCapacityInkWh = (item.numberOfPanels * (panelModelData?.ratings?.wattsPtc ?? 0)) / 1000;
          return this.calculatePVProduction({
            latitude,
            longitude,
            systemCapacityInkWh,
            azimuth: useSunroof && sunroofAzimuth !== undefined ? sunroofAzimuth : azimuth,
            pitch: useSunroof && sunroofPitch !== undefined ? sunroofPitch : pitch,
            losses,
            shouldGetHourlyProduction: true,
          });
        }),
      );
    } else if (systemDesignDto?.capacityProductionDesignData?.panelArray?.length) {
      pvProductionArray = await Promise.all(
        systemDesignDto.capacityProductionDesignData.panelArray.map(async item => {
          const { capacity, azimuth, pitch, losses } = item;
          return this.calculatePVProduction({
            latitude,
            longitude,
            systemCapacityInkWh: capacity,
            azimuth,
            pitch,
            losses,
            shouldGetHourlyProduction: true,
          });
        }),
      );
    }

    const cumulativePvProduction: ISystemProduction = { arrayHourly: [], hourly: [], monthly: [], annual: 0 };
    if (pvProductionArray.length === 1) {
      cumulativePvProduction.arrayHourly = [pvProductionArray[0].hourly] || [];
      cumulativePvProduction.hourly = pvProductionArray[0].hourly || [];
      cumulativePvProduction.monthly = pvProductionArray[0].monthly || [];
      cumulativePvProduction.annual = pvProductionArray[0].annual || 0;
    } else {
      pvProductionArray.forEach(item => {
        cumulativePvProduction.arrayHourly?.push(item.hourly);
        item.hourly.forEach(
          // eslint-disable-next-line no-return-assign
          (value, index) =>
            (cumulativePvProduction.hourly[index] = (cumulativePvProduction.hourly[index] || 0) + value),
        );
        item.monthly.forEach(
          // eslint-disable-next-line no-return-assign
          (value, index) =>
            (cumulativePvProduction.monthly[index] = (cumulativePvProduction.monthly[index] || 0) + value),
        );
        cumulativePvProduction.annual += item.annual;
      });
    }

    return cumulativePvProduction;
  }

  calculateNetUsagePostSystemInstallation(
    currentUtilityUsage: number[],
    pvProduction: number[],
  ): INetUsagePostInstallationSchema {
    const netUsagePostInstallation = ({ hourlyNetUsage: [] } as unknown) as INetUsagePostInstallationSchema;
    currentUtilityUsage.forEach((value, index) => {
      netUsagePostInstallation.hourlyNetUsage[index] = value - (pvProduction[index] || 0);
    });

    netUsagePostInstallation.calculationMode = 'SelfConsumption';

    return netUsagePostInstallation;
  }

  private ensurePvWattIndex(): Promise<string> {
    return this.pvWattSystemProduction.collection.createIndex({
      lat: 1,
      lon: 1,
      system_capacity_kW: 1,
      azimuth: 1,
      tilt: 1,
    });
  }
}

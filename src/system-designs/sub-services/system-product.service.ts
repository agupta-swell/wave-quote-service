import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExternalService } from '../../external-services/external-service.service';
import { ProductService } from 'src/products-v2/services';
import { UpdateSystemDesignDto } from '../req';
import { PvWattSystemProduction, PV_WATT_SYSTEM_PRODUCTION } from '../schemas/pv-watt-system-production.schema';
import { INetUsagePostInstallationSchema } from '../system-design.schema';

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
}
export interface ISystemProduction {
  hourly: number[];
  monthly: number[];
  annual: number;
}

@Injectable()
export class SystemProductService {
  constructor(
    @InjectModel(PV_WATT_SYSTEM_PRODUCTION) private readonly pvWattSystemProduction: Model<PvWattSystemProduction>,
    private readonly externalService: ExternalService,
    private readonly productService: ProductService,
  ) {}

  async pvWatCalculation(data: IPvWatCalculation): Promise<number> {
    const { systemCapacity, ...p } = data;
    const pvWattSystemProduction = await this.pvWattSystemProduction
      .findOne({
        ...p,
        systemCapacityKW: systemCapacity,
      })
      .lean();

    if (pvWattSystemProduction) {
      return pvWattSystemProduction.acAnnualProduction;
    }

    const res = await this.externalService.calculateSystemProduction(data);
    const createdPvWattSystemProduction = new this.pvWattSystemProduction({
      lat: data.lat,
      lon: data.lon,
      systemCapacityKW: data.systemCapacity,
      azimuth: data.azimuth,
      tilt: data.tilt,
      losses: data.losses,
      arrayType: 1,
      moduleType: 1,
      acAnnualHourlyProduction: res.ac,
      acMonthlyProduction: res.ac_monthly,
      acAnnualProduction: res.ac_annual,
    });

    await createdPvWattSystemProduction.save();
    return res.ac_annual;
  }

  async calculatePVProduction(data: ICalculatePVProduction) {
    const { latitude, longitude, systemCapacityInkWh, azimuth, pitch, losses } = data;
    const arrayProductionData: ISystemProduction = { hourly: [], monthly: [], annual: 0 };

    const pvWattSystemProduction = await this.pvWattSystemProduction
      .findOne({
        lat: latitude,
        lon: longitude,
        system_capacity_kW: systemCapacityInkWh,
        azimuth,
        tilt: pitch,
      })
      .lean();

    if (pvWattSystemProduction) {
      arrayProductionData.hourly = pvWattSystemProduction.acAnnualHourlyProduction;
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

    const createdPvWattSystemProduction = new this.pvWattSystemProduction({
      lat: latitude,
      lon: longitude,
      systemCapacityKW: systemCapacityInkWh,
      azimuth,
      tilt: pitch,
      losses,
      array_type: 1,
      module_type: 1,
      acAnnualHourlyProduction: res.ac,
      acMonthlyProduction: res.ac_monthly,
      acAnnualProduction: res.ac_annual,
    });
    await createdPvWattSystemProduction.save();

    arrayProductionData.annual = res.ac_annual;
    arrayProductionData.monthly = res.ac_monthly;
    arrayProductionData.hourly = res.ac;

    return arrayProductionData;
  }

  async calculateSystemProductionByHour(systemDesignDto: UpdateSystemDesignDto): Promise<ISystemProduction> {
    const { latitude, longitude } = systemDesignDto;
    let pvProductionArray: ISystemProduction[] = [{ hourly: [], monthly: [], annual: 0 }];

    if (systemDesignDto?.roofTopDesignData?.panelArray?.length) {
      pvProductionArray = await Promise.all(
        systemDesignDto.roofTopDesignData.panelArray.map(async item => {
          const { azimuth, losses, pitch } = item;
          const panelModelData = await this.productService.getDetailById(item.panelModelId);
          const systemCapacityInkWh = (item.numberOfPanels * (panelModelData?.ratings?.watts ?? 0)) / 1000;
          return this.calculatePVProduction({ latitude, longitude, systemCapacityInkWh, azimuth, pitch, losses });
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
          });
        }),
      );
    }

    const cumulativePvProduction: ISystemProduction = { hourly: [], monthly: [], annual: 0 };
    if (pvProductionArray.length === 1) {
      cumulativePvProduction.hourly = pvProductionArray[0].hourly || [];
      cumulativePvProduction.monthly = pvProductionArray[0].monthly || [];
      cumulativePvProduction.annual = pvProductionArray[0].annual || 0;
    } else {
      pvProductionArray.forEach(item => {
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

  // ==================== INTERNAL ====================
}

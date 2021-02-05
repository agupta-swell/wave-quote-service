import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExternalService } from '../../external-services/external-service.service';
import { ProductService } from '../../products/product.service';
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
    const pvWattSystemProduction = await this.pvWattSystemProduction.findOne({
      lat: data.lat,
      lon: data.lon,
      system_capacity_kW: data.systemCapacity,
      azimuth: data.azimuth,
      tilt: data.tilt,
    });

    if (pvWattSystemProduction) {
      return pvWattSystemProduction.ac_annual_production;
    }

    const res = await this.externalService.calculateSystemProduction(data);
    const createdPvWattSystemProduction = new this.pvWattSystemProduction({
      lat: data.lat,
      lon: data.lon,
      system_capacity_kW: data.systemCapacity,
      azimuth: data.azimuth,
      tilt: data.tilt,
      losses: 5.5,
      array_type: 1,
      module_type: 1,
      ac_annual_hourly_production: res.ac,
      ac_monthly_production: res.ac_monthly,
      ac_annual_production: res.ac_annual,
    });

    await createdPvWattSystemProduction.save();
    return res.ac_annual;
  }

  async calculateSystemProductionByHour(systemDesignDto: UpdateSystemDesignDto): Promise<ISystemProduction> {
    const pvProductionArray = await Promise.all(
      systemDesignDto.roofTopDesignData.panelArray.map(async item => {
        const panelModelData = await this.productService.getDetailById(item.panelModelId);
        const systemCapacityInkWh = (item.numberOfPanels * panelModelData.sizeW) / 1000;
        const arrayProductionData: ISystemProduction = { hourly: [], monthly: [], annual: 0 };

        const pvWattSystemProduction = await this.pvWattSystemProduction.findOne({
          lat: systemDesignDto.latitude,
          lon: systemDesignDto.longtitude,
          system_capacity_kW: systemCapacityInkWh,
          azimuth: item.azimuth,
          tilt: item.pitch,
        });

        if (pvWattSystemProduction) {
          arrayProductionData.hourly = pvWattSystemProduction.ac_annual_hourly_production;
          arrayProductionData.monthly = pvWattSystemProduction.ac_monthly_production;
          arrayProductionData.annual = pvWattSystemProduction.ac_annual_production;
          return arrayProductionData;
        }

        const payload = {
          lat: systemDesignDto.latitude,
          lon: systemDesignDto.longtitude,
          systemCapacity: systemCapacityInkWh,
          azimuth: item.azimuth,
          tilt: item.pitch,
          losses: 5.5,
        } as IPvWatCalculation;
        const res = await this.externalService.calculateSystemProduction(payload);

        const createdPvWattSystemProduction = new this.pvWattSystemProduction({
          lat: systemDesignDto.latitude,
          lon: systemDesignDto.longtitude,
          system_capacity_kW: systemCapacityInkWh,
          azimuth: item.azimuth,
          tilt: item.pitch,
          losses: 5.5,
          array_type: 1,
          module_type: 1,
          ac_annual_hourly_production: res.ac,
          ac_monthly_production: res.ac_monthly,
          ac_annual_production: res.ac_annual,
        });
        await createdPvWattSystemProduction.save();

        arrayProductionData.annual = res.ac_annual;
        arrayProductionData.hourly = res.ac_monthly;
        arrayProductionData.hourly = res.ac;
        return arrayProductionData;
      }),
    );

    let cumulativePvProduction: ISystemProduction = { hourly: [], monthly: [], annual: 0 };
    if (pvProductionArray.length === 1) {
      cumulativePvProduction.hourly = pvProductionArray[0].hourly;
      cumulativePvProduction.monthly = pvProductionArray[0].monthly;
      cumulativePvProduction.annual = pvProductionArray[0].annual;
    } else {
      pvProductionArray.forEach(item => {
        // TODO: need to consider below logic here
        item.hourly.forEach(
          (value, index) =>
            (cumulativePvProduction[index].hourly = (cumulativePvProduction[index].hourly || 0) + value),
        );
        item.monthly.forEach(
          (value, index) =>
            (cumulativePvProduction[index].monthly = (cumulativePvProduction[index].monthly || 0) + value),
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
    const netUsagePostInstallation = { hourly_net_usage: [] } as INetUsagePostInstallationSchema;
    currentUtilityUsage.forEach((value, index) => {
      netUsagePostInstallation.hourly_net_usage[index] = value - pvProduction[index];
    });

    netUsagePostInstallation.calculation_mode = 'SelfConsumption';

    return netUsagePostInstallation;
  }

  // ==================== INTERNAL ====================
}

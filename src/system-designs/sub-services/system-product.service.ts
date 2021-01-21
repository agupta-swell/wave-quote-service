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

@Injectable()
export class SystemProductService {
  constructor(
    @InjectModel(PV_WATT_SYSTEM_PRODUCTION) private readonly pvWattSystemProduction: Model<PvWattSystemProduction>,
    private readonly externalService: ExternalService,
    private readonly productService: ProductService,
  ) {}

  async pvWatCalculation(data: IPvWatCalculation): Promise<number> {
    const { ac_annual: acAnnual } = await this.externalService.calculateSystemProduction(data);
    return acAnnual;
  }

  async calculateSystemProductionByHour(systemDesignDto: UpdateSystemDesignDto): Promise<number[]> {
    const pvProductionArray = await Promise.all(
      systemDesignDto.roofTopDesignData.panelArray.map(async item => {
        const panelModelData = await this.productService.getDetailById(item.panelModelId);
        const systemCapacityInkWh = item.numberOfPanels * panelModelData.sizeW;

        const pvWattSystemProduction = await this.pvWattSystemProduction.findOne({
          lat: systemDesignDto.latitude,
          lon: systemDesignDto.longtitude,
          system_capacity_kW: systemCapacityInkWh,
          azimuth: item.azimuth,
          tilt: item.pitch,
        });

        if (pvWattSystemProduction) {
          return pvWattSystemProduction.ac_annual_hourly_production;
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
        });
        await createdPvWattSystemProduction.save();
        return res.ac as number[];
      }),
    );

    let cumulativePvProduction = [];
    if (pvProductionArray.length === 1) {
      cumulativePvProduction = pvProductionArray[0];
    } else {
      pvProductionArray.forEach(item =>
        item.forEach((value, index) => (cumulativePvProduction[index] = (cumulativePvProduction[index] || 0) + value)),
      );
    }

    return cumulativePvProduction as number[];
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
}

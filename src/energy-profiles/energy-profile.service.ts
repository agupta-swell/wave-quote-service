import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { S3Service } from 'src/shared/aws/services/s3.service';
import { SunroofHourlyProductionCalculation } from 'src/system-designs/sub-services';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { PvWattProductionDto } from 'src/system-production/res';
import { IEnergyProfileProduction } from 'src/system-production/system-production.schema';
import { SystemProductionService } from 'src/system-production/system-production.service';
import { buildMonthlyAndAnnuallyDataFrom8760 } from 'src/utils/transformData';

@Injectable()
export class EnergyProfileService {
  private PINBALL_SIMULATE_BUCKET = process.env.AWS_S3_PINBALL_SIMULATE as string;

  constructor(
    @Inject(forwardRef(() => SystemDesignService))
    private readonly systemDesignService: SystemDesignService,
    private readonly sunroofHourlyProductionCalculationService: SunroofHourlyProductionCalculation,
    private readonly systemProductionService: SystemProductionService,
    private readonly s3Service: S3Service,
  ) {}

  async getPvWattProduction(systemDesignId: ObjectId): Promise<PvWattProductionDto | undefined> {
    const systemDesign = await this.systemDesignService.getDetails(systemDesignId);
    return systemDesign.data?.systemProductionData.pvWattProduction;
  }

  async getSunroofHourlyProduction(systemDesignId: ObjectId | string): Promise<IEnergyProfileProduction> {
    const foundSystemDesign = await this.systemDesignService.getOneById(systemDesignId);

    if (!foundSystemDesign) {
      throw new NotFoundException(`System design with id ${systemDesignId} not found`);
    }

    const cachedSunroofHourlyProduction = await this.sunroofHourlyProductionCalculationService.getS3HourlyProduction(
      foundSystemDesign.opportunityId,
      systemDesignId,
    );

    if (cachedSunroofHourlyProduction) return cachedSunroofHourlyProduction;

    const foundSystemProduction = await this.systemProductionService.findOne(foundSystemDesign.systemProductionId);

    if (!foundSystemProduction)
      throw new NotFoundException(`System production in system design with id ${systemDesignId} not found`);

    const sunroofHourlyProduction = await this.sunroofHourlyProductionCalculationService.calculateClippingSunroofProduction(
      foundSystemDesign,
      foundSystemProduction,
    );

    return sunroofHourlyProduction;
  }

  async getBatteryChargingSeries(systemDesignId: ObjectId | string): Promise<IEnergyProfileProduction> {
    const res = await this.s3Service.getObject(this.PINBALL_SIMULATE_BUCKET, `${systemDesignId}/batteryChargingSeries`);

    if (!res) {
      throw new NotFoundException(
        `Not found BatteryChargingSeries in system design with id ${systemDesignId} not found`,
      );
    }
    const result: number[] = JSON.parse(res);

    return buildMonthlyAndAnnuallyDataFrom8760(result);
  }

  async getBatteryDischargingSeries(systemDesignId: ObjectId | string): Promise<IEnergyProfileProduction> {
    const res = await this.s3Service.getObject(
      this.PINBALL_SIMULATE_BUCKET,
      `${systemDesignId}/batteryDischargingSeries`,
    );
    if (!res) {
      throw new NotFoundException(
        `Not found BatteryChargingSeries in system design with id ${systemDesignId} not found`,
      );
    }
    const result: number[] = JSON.parse(res);

    return buildMonthlyAndAnnuallyDataFrom8760(result);
  }
}

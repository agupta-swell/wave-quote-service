import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { SunroofHourlyProductionCalculation } from 'src/system-designs/sub-services';
import { ISunroofHourlyProduction } from 'src/system-designs/sub-services/types';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { PvWattProductionDto } from 'src/system-production/res';
import { SystemProductionService } from 'src/system-production/system-production.service';

@Injectable()
export class EnergyProfileService {
  constructor(
    @Inject(forwardRef(() => SystemDesignService))
    private readonly systemDesignService: SystemDesignService,
    private readonly sunroofHourlyProductionCalculationService: SunroofHourlyProductionCalculation,
    private readonly systemProductionService: SystemProductionService,
  ) {}

  async findBySystemDesignId(systemDesignId: ObjectId): Promise<PvWattProductionDto | undefined> {
    const systemDesign = await this.systemDesignService.getDetails(systemDesignId);
    return systemDesign.data?.systemProductionData.pvWattProduction;
  }

  async getSunroofHourlyProduction(systemDesignId: ObjectId | string): Promise<ISunroofHourlyProduction> {
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
}

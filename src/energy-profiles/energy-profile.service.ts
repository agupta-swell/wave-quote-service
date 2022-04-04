import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { PvWattProductionDto } from 'src/system-production/res';

@Injectable()
export class EnergyProfileService {
  constructor(private readonly systemDesignService: SystemDesignService) {}

  async findBySystemDesignId(systemDesignId: ObjectId): Promise<PvWattProductionDto | undefined> {
    const systemDesign = await this.systemDesignService.getDetails(systemDesignId);
    return systemDesign.data?.systemProductionData.pvWattProduction;
  }
}

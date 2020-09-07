import { Injectable } from '@nestjs/common';
import { ExternalService } from '../../external-services/external-service.service';

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
  constructor(private readonly externalService: ExternalService) {}

  async pvWatCalculation(data: IPvWatCalculation) {
    const acAnnual = await this.externalService.calculateSystemProduction(data);
    return acAnnual;
  }
}

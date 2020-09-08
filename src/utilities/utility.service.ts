import { UtilityDto } from './res/utility.dto';
import { OperationResult } from './../app/common';
import { Injectable } from '@nestjs/common';
import { ExternalService } from '../external-services/external-service.service';

@Injectable()
export class UtilityService {
  constructor(private readonly externalService: ExternalService) {}

  async getUtilityDetails(zipCode: number): Promise<OperationResult<UtilityDto>> {
    const loadServingEntityData = await this.externalService.getLoadServingEntity(zipCode);
    const data = { loadServingEntityData };
    return OperationResult.ok(new UtilityDto(data));
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExternalService } from '../external-services/external-service.service';
import { OperationResult } from './../app/common';
import { UpdateUsageDto } from './req/update-usage';
import { UtilityDto } from './res/utility.dto';
import {
  GenabilityTypicalBaseLine,
  GenabilityTypicalBaseLineModel,
  GENABILITY_TYPICAL_BASE_LINE,
  UtilityUsageDetails,
  UtilityUsageDetailsModel,
  UTILITY_USAGE_DETAILS,
} from './utility.schema';

@Injectable()
export class UtilityService {
  constructor(
    @InjectModel(GENABILITY_TYPICAL_BASE_LINE)
    private readonly genabilityTypicalBaseLineModel: Model<GenabilityTypicalBaseLine>,
    @InjectModel(UTILITY_USAGE_DETAILS)
    private readonly utilityUsageDetailsModel: Model<UtilityUsageDetails>,
    private readonly externalService: ExternalService,
  ) {}

  async getUtilityDetails(zipCode: number): Promise<OperationResult<UtilityDto>> {
    const loadServingEntityData = await this.externalService.getLoadServingEntity(zipCode);
    const data = { loadServingEntityData };
    return OperationResult.ok(new UtilityDto(data));
  }

  async getTypicalBaseline(zipCode: number): Promise<OperationResult<UtilityDto>> {
    const typicalBaseLine = await this.genabilityTypicalBaseLineModel.findOne({ zip_code: zipCode });
    if (typicalBaseLine) {
      const typicalBaseLineObj = typicalBaseLine.toObject();
      delete typicalBaseLineObj.typical_hourly_usage;
      const data = { typicalBaselineUsage: typicalBaseLineObj };
      return OperationResult.ok(new UtilityDto(data));
    }

    const typicalBaseLineAPI = await this.externalService.getTypicalBaseLine(zipCode);
    const genabilityTypicalBaseLine = new GenabilityTypicalBaseLineModel(typicalBaseLineAPI);

    const createdTypicalBaseLine = new this.genabilityTypicalBaseLineModel(genabilityTypicalBaseLine);
    await createdTypicalBaseLine.save();

    const createdTypicalBaseLineObj = createdTypicalBaseLine.toObject();
    delete createdTypicalBaseLineObj.typical_hourly_usage;
    const data = { typicalBaselineUsage: createdTypicalBaseLineObj };
    return OperationResult.ok(new UtilityDto(data));
  }

  async updateUsage(usage: UpdateUsageDto): Promise<boolean> {
    const utilityUsageDetailsModel = new UtilityUsageDetailsModel(usage);
    const model = new this.utilityUsageDetailsModel(utilityUsageDetailsModel);
    await model.save();

    return true;
  }
}

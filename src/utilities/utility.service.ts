import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { groupBy, sumBy } from 'lodash';
import { Model } from 'mongoose';
import { ExternalService } from '../external-services/external-service.service';
import { OperationResult } from './../app/common';
import { UpdateUsageDto } from './req/update-usage';
import { TariffDto, UtilityDto } from './res';
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

  async getTariff(zipCode: number, lseId: number): Promise<OperationResult<TariffDto[]>> {
    const data = await this.externalService.getTariff(zipCode);
    const result = data.filter((item: any) => item.lseId === lseId);
    return OperationResult.ok(result.map(item => new TariffDto(item)));
  }

  async calculateCost(hourlyDataForTheYear: number[], masterTariffId: string): Promise<OperationResult<any>> {
    const data = await this.externalService.calculateCost([], masterTariffId);
    const groupByMonth = groupBy(data[0].items, item => item.fromDateTime.substring(0, 7));
    const monthlyCosts = Object.keys(groupByMonth).reduce(
      (acc, item) => [...acc, { [item]: sumBy(groupByMonth[item], 'cost') }],
      [],
    );
    return OperationResult.ok(monthlyCosts);
  }

  // -->>>>>>>>> INTERNAL <<<<<<<<<----
  async getUtilityByOpportunityId(opportunityId: string): Promise<UtilityDto> {
    const utility = await this.utilityUsageDetailsModel.findOne({ opportunity_id: opportunityId });
    return utility ? new UtilityDto(utility) : null;
  }
}

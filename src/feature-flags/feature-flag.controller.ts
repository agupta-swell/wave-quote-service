import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { FeatureFlagService } from './feature-flag.service';
import { FeatureFlagDto } from './res/feature-flag.dto';

@ApiTags('Feature flags')
@Controller('/feature-flags')
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Get()
  @ApiOperation({ summary: 'Get all feature flags' })
  @ApiOkResponse({ type: FeatureFlagDto })
  async getAllToolTips(): Promise<ServiceResponse<FeatureFlagDto[]>> {
    const result = await this.featureFlagService.getAllFeatureFlags();
    return ServiceResponse.fromResult(result);
  }
}

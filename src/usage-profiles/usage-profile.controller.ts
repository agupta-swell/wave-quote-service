import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from '../app/securities';
import { UsageProfileResDto } from './res';
import { UsageProfileService } from './usage-profile.service';

@ApiTags('Usage Profiles')
@ApiBearerAuth()
@Controller('/usage-profiles')
@PreAuthenticate()
export class UsageProfileController {
  constructor(private readonly usageProfileService: UsageProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get all usage profiles' })
  @ApiOkResponse({ type: UsageProfileResDto })
  async getAll(): Promise<ServiceResponse<UsageProfileResDto>> {
    const res = await this.usageProfileService.getAllUsageProfiles();
    return ServiceResponse.fromResult(res);
  }
}

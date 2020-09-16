import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { AdderConfigService } from './adder-config.service';
import { AdderConfigDto } from './res/adder-config.dto';

@ApiTags('Adder Config')
@Controller('/adder-configs')
export class AdderConfigController {
  constructor(private readonly adderConfigService: AdderConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get all adder configs' })
  @ApiOkResponse({ type: Pagination })
  async getQuotings(
    @Query() query: { limit: string; skip: string },
  ): Promise<ServiceResponse<Pagination<AdderConfigDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const result = await this.adderConfigService.getAllAdderConfigs(limit, skip);
    return ServiceResponse.fromResult(result);
  }
}

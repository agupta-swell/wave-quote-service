import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from '../app/securities';
import { FundingSourceService } from './funding-source.service';
import { FundingSourceDto } from './res/funding-source.dto';

@ApiTags('Funding Source')
@ApiBearerAuth()
@Controller('/funding-sources')
@PreAuthenticate()
export class FundingSourceController {
  constructor(private readonly fundingSourceService: FundingSourceService) {}

  @Get()
  @ApiQuery({ name: 'limit' })
  @ApiQuery({ name: 'skip' })
  @ApiOperation({ summary: 'Get all funding sources' })
  async getQuotings(
    @Query() query: { limit: string; skip: string },
  ): Promise<ServiceResponse<Pagination<FundingSourceDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const result = await this.fundingSourceService.getList(limit, skip);
    return ServiceResponse.fromResult(result);
  }
}

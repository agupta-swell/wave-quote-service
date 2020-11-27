import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from '../app/securities';
import { UtilityProgramDto, UtilityProgramListRes } from './res/utility-program.dto';
import { UtilityProgramService } from './utility-program.service';

@ApiTags('Utility Program')
@ApiBearerAuth()
@Controller('/utility-programs')
@PreAuthenticate()
export class UtilityProgramController {
  constructor(private readonly utilityProgramService: UtilityProgramService) {}

  @Get()
  @ApiOperation({ summary: 'Get List' })
  @ApiOkResponse({ type: UtilityProgramListRes })
  async getList(): Promise<ServiceResponse<Pagination<UtilityProgramDto>>> {
    const res = await this.utilityProgramService.getList();
    return ServiceResponse.fromResult(res);
  }

  @Post()
  @ApiOperation({ summary: 'Create Data Feed' })
  async dataFeed() {
    await this.utilityProgramService.createDataFeed();
    return 'OK';
  }
}

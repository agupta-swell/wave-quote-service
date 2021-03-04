import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from '../app/securities';
import { UtilityProgramMasterDto, UtilityProgramMasterListRes } from './res/utility-program-master.dto';
import { UtilityProgramMasterService } from './utility-program-master.service';

@ApiTags('Utility Program Master')
@ApiBearerAuth()
@Controller('/utility-programs-master')
@PreAuthenticate()
export class UtilityProgramMasterController {
  constructor(private readonly utilityProgramMasterService: UtilityProgramMasterService) {}

  @Get()
  @ApiOperation({ summary: 'Get List' })
  @ApiOkResponse({ type: UtilityProgramMasterListRes })
  async getList(): Promise<ServiceResponse<Pagination<UtilityProgramMasterDto>>> {
    const res = await this.utilityProgramMasterService.getList();
    return ServiceResponse.fromResult(res);
  }

  @Post()
  @ApiOperation({ summary: 'Create Data Feed' })
  async dataFeed(): Promise<string> {
    await this.utilityProgramMasterService.createDataFeed();
    return 'OK';
  }
}

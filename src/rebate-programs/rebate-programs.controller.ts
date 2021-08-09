import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from '../app/securities';
import { RebateProgramDto, RebateProgramRes } from './res/rebate-program.dto';
import { RebateProgramService } from './rebate-programs.service';

@ApiTags('Rebate Program')
@ApiBearerAuth()
@Controller('/rebate-programs')
@PreAuthenticate()
export class RebateProgramController {
  constructor(private readonly rebateProgramService: RebateProgramService) {}

  @Get()
  @ApiOperation({ summary: 'Get List' })
  @ApiOkResponse({ type: RebateProgramRes })
  async getList(): Promise<ServiceResponse<Pagination<RebateProgramDto>>> {
    const res = await this.rebateProgramService.getList();
    return ServiceResponse.fromResult(res);
  }
}

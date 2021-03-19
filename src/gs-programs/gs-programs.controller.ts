import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { GsProgramsService } from './gs-programs.service';
import { GsProgramsDto, GsProgramsPaginationRes } from './res/gs-programs.dto';

@ApiTags('GsPrograms')
@ApiBearerAuth()
@Controller('/gs-programs')
@PreAuthenticate()
export class GsProgramsController {
  constructor(private readonly gsProgramsService: GsProgramsService) {}

  @Get('/utility-program-master')
  @ApiQuery({ name: 'limit' })
  @ApiQuery({ name: 'skip' })
  @ApiQuery({ name: 'utility-program-master-id' })
  @ApiOperation({ summary: 'Get GsPrograms By UtilityProgramMaster ID' })
  @ApiOkResponse({ type: GsProgramsPaginationRes })
  async getGsPrograms(
    @Query() query: { limit: string; skip: string; 'utility-program-master-id': string },
  ): Promise<ServiceResponse<Pagination<GsProgramsDto>>> {
    const limit = Number(query.limit || 100);
    const skip = Number(query.skip || 0);
    const utilityProgramMasterId = query['utility-program-master-id'];
    const gsPrograms = await this.gsProgramsService.getList(limit, skip, utilityProgramMasterId);

    return ServiceResponse.fromResult(gsPrograms);
  }
}

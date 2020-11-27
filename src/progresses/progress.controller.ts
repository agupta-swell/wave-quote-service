import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from '../app/securities';
import { ProgressService } from './progress.service';
import { ProgressDto, ProgressRes } from './res/progress.dto';

@ApiTags('Progress')
@ApiBearerAuth()
@Controller('/progress')
@PreAuthenticate()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('/:opportunityId')
  @ApiOperation({ summary: 'Get counter' })
  @ApiOkResponse({ type: ProgressRes })
  async getCounter(@Param('opportunityId') opportunityId: string): Promise<ServiceResponse<ProgressDto>> {
    const res = await this.progressService.countEachProgress(opportunityId);
    return ServiceResponse.fromResult(res);
  }
}

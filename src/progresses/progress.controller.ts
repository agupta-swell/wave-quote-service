import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { ProgressService } from './progress.service';
import { ProgressRes, ProgressDto } from './res/progress.dto';

@ApiTags('Progress')
@Controller('/progress')
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

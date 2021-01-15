import { Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { LeaseSolverConfigService } from './lease-solver-config.service';

@ApiTags('Lease Config')
@ApiBearerAuth()
@Controller('/lease-configs')
@PreAuthenticate()
export class LeaseSolverConfigController {
  constructor(private readonly leaseSolverConfigService: LeaseSolverConfigService) {}

  @Post()
  @ApiOperation({ summary: 'Handle Data Source From CSV file' })
  async createDataFromCSV(@Req() req: any): Promise<ServiceResponse<string>> {
    const result = await this.leaseSolverConfigService.createDataFromCSV(req);
    return ServiceResponse.fromResult(result);
  }
}

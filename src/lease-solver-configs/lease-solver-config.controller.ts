import { Controller, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { LeaseSolverConfigService } from './lease-solver-config.service';

@ApiTags('Lease Config')
@Controller('/lease-configs')
export class LeaseSolverConfigController {
  constructor(private readonly leaseSolverConfigService: LeaseSolverConfigService) {}

  @Post()
  @ApiOperation({ summary: 'Handle Data Source From CSV file' })
  async getQuotings(@Req() req: any): Promise<ServiceResponse<string>> {
    const result = await this.leaseSolverConfigService.createDataFromCSV(req);
    return ServiceResponse.fromResult(result);
  }
}

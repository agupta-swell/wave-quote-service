import { Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { FastifyRequest } from 'src/shared/fastify';
import { EsaPricingSolverService } from './v2-esa-pricing-solver.service';

@ApiTags('Esa Pricing Solver')
@ApiBearerAuth()
@Controller('/esa-pricing-solvers')
@PreAuthenticate()
export class EsaPricingSolverController {
  constructor(private readonly esaPricingSolverService: EsaPricingSolverService) {}

  @Post("/upload-csv")
  @ApiOperation({ summary: 'Handle Data Source From CSV file' })
  async createDataFromCSV(@Req() req: FastifyRequest): Promise<ServiceResponse<string>> {
    const result = await this.esaPricingSolverService.createDataFromCSV(req);
    return ServiceResponse.fromResult(result);
  }
}

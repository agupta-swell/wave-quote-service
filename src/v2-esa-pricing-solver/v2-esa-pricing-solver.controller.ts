import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { FastifyRequest } from 'src/shared/fastify';
import { V2EsaPricingCalculation, V2EsaPricingSolverDocument } from './interfaces';
import { EsaPricingSolverService } from './v2-esa-pricing-solver.service';

@ApiTags('Esa Pricing Solver')
@ApiBearerAuth()
@Controller('/esa-pricing-solvers')
@PreAuthenticate()
export class EsaPricingSolverController {
  constructor(private readonly esaPricingSolverService: EsaPricingSolverService) {}

  @Post('/upload-csv')
  @ApiOperation({ summary: 'Handle Data Source From CSV file' })
  async createDataFromCSV(@Req() req: FastifyRequest): Promise<ServiceResponse<string>> {
    const result = await this.esaPricingSolverService.createDataFromCSV(req);
    return ServiceResponse.fromResult(result);
  }

  @Get('/esa-solver')
  @ApiOperation({ summary: 'get the latest data from the uploaded ESA solver' })
  async getEsaSolverRow(
    @Query('opportunityId') opportunityId,
    @Query('systemDesignId') systemDesignId,
    @Query('partnerId') partnerId,
    @Query('fundingSourceId') fundingSourceId,
    @Query('financialProductId') financialProductId,
    @Query('recentQuoteId') recentQuoteId,
  ): Promise<ServiceResponse<string>> {
    const result = await this.esaPricingSolverService.getEsaSolverRow(
      opportunityId,
      systemDesignId,
      partnerId,
      fundingSourceId,
      financialProductId,
      recentQuoteId,
    );
    return ServiceResponse.fromResult(result._id);
  }

  @Get('/esc-and-term')
  @ApiOperation({ summary: 'get the latest data from the uploaded ESA solver' })
  async getEcsAndTerm(
    @Query('opportunityId') opportunityId,
    @Query('systemDesignId') systemDesignId,
    @Query('partnerId') partnerId,
    @Query('fundingSourceId') fundingSourceId,
    @Query('financialProductId') financialProductId,
  ): Promise<LeanDocument<V2EsaPricingSolverDocument>[]> {
    return this.esaPricingSolverService.getEcsAndTerm(
      opportunityId,
      systemDesignId,
      partnerId,
      fundingSourceId,
      financialProductId,
    );
  }

  @Get('/calculate/:quoteId')
  @ApiOperation({ summary: 'Calculate ESA Pricing Solver given quoteId' })
  async calculate(@Param('quoteId') quoteId: string): Promise<ServiceResponse<V2EsaPricingCalculation>> {
    const res = await this.esaPricingSolverService.calculate(quoteId);
    return ServiceResponse.fromResult(res);
  }
}

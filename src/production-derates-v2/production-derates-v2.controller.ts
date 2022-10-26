import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { ProductionDeratesService } from './production-derates-v2.service';
import { ProductionDeratesDto } from './res/production-derates-v2.dto';

@ApiTags('Production Derates')
@Controller('/production-derates')
export class ProductionDeratesController {
  constructor(private readonly productionDeratesService: ProductionDeratesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all production derates' })
  @ApiOkResponse({ type: ProductionDeratesDto })
  async getAllProductionDerates(): Promise<ServiceResponse<ProductionDeratesDto[]>> {
    const result = await this.productionDeratesService.getAllProductionDerates();
    return ServiceResponse.fromResult(result);
  }
}

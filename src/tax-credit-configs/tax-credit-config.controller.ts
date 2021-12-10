import { Controller, Get } from '@nestjs/common';
import { Pagination, ServiceResponse } from 'src/app/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PreAuthenticate } from 'src/app/securities';
import { TaxCreditConfigService } from './tax-credit-config.service';
import { TaxCreditConfigListRes, TaxCreditConfigResDto } from './dto';

@ApiTags('Tax Credit configs')
@ApiBearerAuth()
@Controller('/tax-credit-configs')
@PreAuthenticate()
export class TaxCreditConfigController {
  constructor(private readonly taxCreditConfigService: TaxCreditConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tax credit configs' })
  @ApiOkResponse({ type: TaxCreditConfigListRes })
  async getAllTaxCreditConfigs(): Promise<ServiceResponse<Pagination<TaxCreditConfigResDto>>> {
    const res = await this.taxCreditConfigService.getAllTaxCredits();
    return ServiceResponse.fromResult(res);
  }
}

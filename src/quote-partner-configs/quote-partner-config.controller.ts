import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { PreAuthenticate } from 'src/app/securities';
import { QuotePartnerConfigService } from './quote-partner-config.service';
import { V2QuotePartnerConfigDto, V2QuotePartnerConfigResponse } from './res/quote-partner-config.dto';

@ApiTags('Quote Partner Config')
@ApiBearerAuth()
@Controller('/quote-partner-configs')
@PreAuthenticate()
export class QuotePartnerConfigController {
  constructor(private readonly quotePartnerConfigServiceService: QuotePartnerConfigService) {}

  @Get()
  @ApiQuery({ name: 'partnerId', required: true })
  @ApiOperation({ summary: 'Get Quote Partner Config By Partner Id' })
  @ApiOkResponse({ type: V2QuotePartnerConfigResponse })
  async getAllProductsByType(@Query('partnerId') partnerId: string): Promise<ServiceResponse<V2QuotePartnerConfigDto>> {
    const result = await this.quotePartnerConfigServiceService.getConfigByPartnerId(partnerId);
    return ServiceResponse.fromResult(result);
  }
}

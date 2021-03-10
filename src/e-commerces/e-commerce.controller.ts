import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { ECommerceService } from './e-commerce.service';
import { GetEcomSystemDesignAndQuoteReq } from './req/get-ecom-system-design-and-quote.dto';
import {
  GetEcomSystemDesignAndQuoteDto,
  GetEcomSystemDesignAndQuoteRes,
} from './res/get-ecom-system-design-and-quote.dto';

@ApiTags('E Commerce')
@Controller('/e-commerces')
export class ECommerceController {
  constructor(private readonly eCommerceService: ECommerceService) {}

  @Post()
  @ApiOperation({ summary: 'Get E Commerce' })
  @ApiOkResponse({ type: GetEcomSystemDesignAndQuoteRes })
  async getEcomSystemDesignAndQuote(
    @Body() req: GetEcomSystemDesignAndQuoteReq,
  ): Promise<ServiceResponse<GetEcomSystemDesignAndQuoteDto>> {
    const result = await this.eCommerceService.getEcomSystemDesignAndQuote(req);
    return ServiceResponse.fromResult(result);
  }
}

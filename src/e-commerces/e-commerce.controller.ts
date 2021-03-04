import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { ECommerceService } from './e-commerce.service';
import { GetEcomSystemDesignAndQuoteReq } from './req/get-ecom-system-design-and-quote.dto';
import {
  GetEcomSystemDesignAndQuoteDto,
  GetEcomSystemDesignAndQuoteRes,
} from './res/get-ecom-system-design-and-quote.dto';

@ApiTags('E Commerce')
@ApiBearerAuth()
@Controller('/e-commerces')
// @PreAuthenticate()
export class ECommerceController {
  constructor(private readonly eCommerceService: ECommerceService) {}

  @Post()
  @ApiOperation({ summary: 'Get all products by type' })
  @ApiOkResponse({ type: GetEcomSystemDesignAndQuoteRes })
  async getAllProductsByType(
    @Body() req: GetEcomSystemDesignAndQuoteReq,
  ): Promise<ServiceResponse<GetEcomSystemDesignAndQuoteDto>> {
    const result = await this.eCommerceService.getData(req);
    return ServiceResponse.fromResult(result);
  }
}

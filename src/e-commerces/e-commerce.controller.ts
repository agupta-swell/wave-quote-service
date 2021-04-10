import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { ECommerceService } from './e-commerce.service';
import { GetEcomSystemDesignAndQuoteReq } from './req/get-ecom-system-design-and-quote.dto';
import { GetGeneratedSystemStorageQuoteRes } from './res/get-generated-system-storage-quote.dto';

@ApiTags('E Commerce')
@Controller('/e-commerces')
export class ECommerceController {
  constructor(private readonly eCommerceService: ECommerceService) {}

  @Post('/system-and-storage')
  @ApiOperation({ summary: 'Get E Commerce Quote for System and Storage' })
  @ApiOkResponse({ type: GetGeneratedSystemStorageQuoteRes })
  async getGeneratedSystemStorageQuote(
    @Body() req: GetEcomSystemDesignAndQuoteReq,
  ): Promise<ServiceResponse<GetGeneratedSystemStorageQuoteRes>> {
    const result = await this.eCommerceService.getGeneratedSystemAndQuote(req);
    return ServiceResponse.fromResult(result);
  }
}

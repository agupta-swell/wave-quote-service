import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { ECommerceService } from './e-commerce.service';
import { GetEcomStorageOnlyQuoteReq } from './req/get-ecom-storage-only-quote.dto';
import { GetEcomSystemDesignAndQuoteReq } from './req/get-ecom-system-design-and-quote.dto';
import { GetGeneratedSystemStorageQuoteRes } from './res/get-generated-system-storage-quote.dto';
import { GetStorageOnlyQuoteRes } from './res/get-storage-only-quote.dto';

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

  @Post('/storage-only')
  @ApiOperation({ summary: 'Get E Commerce Quote for Storage Only' })
  @ApiOkResponse({ type: GetStorageOnlyQuoteRes })
  async getStorageOnlyQuote(
    @Body() req: GetEcomStorageOnlyQuoteReq,
  ): Promise<ServiceResponse<GetStorageOnlyQuoteRes>> {
    const result = await this.eCommerceService.getStorageOnlyQuote(req);
    return ServiceResponse.fromResult(result);
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceResponse } from 'src/app/common';
import { QuoteService } from './quote.service';
import { CreateQuoteDto } from './req/create-quote.dto';
import { QuoteDto } from './res/quote.dto';

@ApiTags('Quote')
@Controller('/quotes')
export class QuoteController {
  constructor(private quoteService: QuoteService) {}

  @Post()
  async create(@Body() data: CreateQuoteDto): Promise<ServiceResponse<QuoteDto>> {
    const res = await this.quoteService.createQuote(data);
    return ServiceResponse.fromResult(res);
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OperationResult } from './../app/common/operation-result';
import { QuoteService } from './quote.service';
import { CreateQuoteDto } from './req/create-quote.dto';
import { QuoteDto } from './res/quote.dto';

@ApiTags('Quote')
@Controller('/quotes')
export class QuoteController {
  constructor(private quoteService: QuoteService) {}

  @Post()
  async create(@Body() data: CreateQuoteDto): Promise<OperationResult<QuoteDto>> {
    return null
  }
}

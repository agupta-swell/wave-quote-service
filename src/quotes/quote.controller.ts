import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { QuoteService } from './quote.service';
import { CalculateQuoteDetailDto, CreateQuoteDto, UpdateQuoteDto } from './req';
import { QuoteDto, QuoteListRes, QuoteRes } from './res/quote.dto';

@ApiTags('Quote')
@Controller('/quotes')
export class QuoteController {
  constructor(private quoteService: QuoteService) {}

  @Post()
  @ApiOperation({ summary: 'Create quote' })
  @ApiOkResponse({ type: QuoteRes })
  async create(@Body() data: CreateQuoteDto): Promise<ServiceResponse<QuoteDto>> {
    const res = await this.quoteService.createQuote(data);
    return ServiceResponse.fromResult(res);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quotes' })
  @ApiOkResponse({ type: QuoteListRes })
  async getListQuotes(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('systemDesignId') systemDesignId: string,
  ): Promise<ServiceResponse<Pagination<QuoteDto>>> {
    const res = await this.quoteService.getAllQuotes(Number(limit || 0), Number(skip || 0), systemDesignId);
    return ServiceResponse.fromResult(res);
  }

  @Get('/:quoteId')
  @ApiOperation({ summary: 'Get detailed quote' })
  @ApiOkResponse({ type: QuoteListRes })
  async getDetails(@Param('quoteId') quoteId: string): Promise<ServiceResponse<QuoteDto>> {
    const res = await this.quoteService.getDetailQuote(quoteId);
    return ServiceResponse.fromResult(res);
  }

  @Put('/:quoteId')
  @ApiOperation({ summary: 'Update quote' })
  @ApiOkResponse({ type: QuoteRes })
  async updateQuote(
    @Body() data: UpdateQuoteDto,
    @Param('quoteId') quoteId: string,
  ): Promise<ServiceResponse<QuoteDto>> {
    const res = await this.quoteService.updateQuote(quoteId, data);
    return ServiceResponse.fromResult(res);
  }

  @Post('/calculations')
  @ApiOperation({ summary: 'Calculate Quote Detail' })
  @ApiOkResponse({ type: QuoteRes })
  async calculateQuoteDetails(@Body() data: CalculateQuoteDetailDto): Promise<ServiceResponse<QuoteDto>> {
    const res = await this.quoteService.calculateQuoteDetail(data);
    return ServiceResponse.fromResult(res);
  }
}

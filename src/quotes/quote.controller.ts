import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { Pagination, ServiceResponse } from 'src/app/common';
import { CheckOpportunity } from 'src/app/opportunity.pipe';
import { PreAuthenticate } from 'src/app/securities';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { QuoteService } from './quote.service';
import { CalculateQuoteDetailDto, CreateQuoteDto, LeaseQuoteValidationDto, UpdateQuoteDto } from './req';
import { UpdateLatestQuoteDto } from './req/update-latest-quote.dto';
import { DiscountListRes, DiscountsDto, QuoteDto, QuoteListRes, QuoteRes, TaxCreditDto, TaxCreditListRes } from './res';

@ApiTags('Quote')
@ApiBearerAuth()
@Controller('/quotes')
@PreAuthenticate()
export class QuoteController {
  constructor(private quoteService: QuoteService) {}

  @Post()
  @ApiOperation({ summary: 'Create quote' })
  @ApiOkResponse({ type: QuoteRes })
  @CheckOpportunity()
  async create(@Body() data: CreateQuoteDto): Promise<ServiceResponse<QuoteDto>> {
    const res = await this.quoteService.createQuote(data);
    return ServiceResponse.fromResult(res);
  }

  @Get('/tax-credits')
  @ApiOperation({ summary: 'Get All Tax Credits' })
  @ApiOkResponse({ type: TaxCreditListRes })
  async getListTaxCredits(): Promise<ServiceResponse<Pagination<TaxCreditDto>>> {
    const res = await this.quoteService.getAllTaxCredits();
    return ServiceResponse.fromResult(res);
  }

  @Post('/lease-quote-validations')
  @ApiOperation({ summary: 'Get condition to find out lease config' })
  async checkConditionsForLeaseQuote(@Body() data: LeaseQuoteValidationDto): Promise<ServiceResponse<string>> {
    const res = await this.quoteService.getValidationForLease(data);
    return ServiceResponse.fromResult(res);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quotes' })
  @ApiOkResponse({ type: QuoteListRes })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'opportunityId', required: false })
  @ApiQuery({ name: 'systemDesignId', required: false })
  @ApiQuery({ name: 'isSync', required: false })
  async getListQuotes(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('isSync') isSync: string,
    @Query('systemDesignId') systemDesignId: string,
    @Query('opportunityId') opportunityId: string,
  ): Promise<ServiceResponse<Pagination<QuoteDto>>> {
    const res = await this.quoteService.getAllQuotes(
      Number(limit || 100),
      Number(skip || 0),
      systemDesignId,
      opportunityId,
      isSync,
    );
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
  @ApiParam({
    name: 'quoteId',
    type: String,
  })
  @CheckOpportunity()
  async updateQuote(
    @Body() data: UpdateQuoteDto,
    @Param('quoteId', ParseObjectIdPipe) quoteId: ObjectId,
  ): Promise<ServiceResponse<QuoteDto>> {
    const res = await this.quoteService.updateQuote(quoteId, data);
    return ServiceResponse.fromResult(res);
  }

  @Put('/:quoteId/latest')
  @ApiOperation({ summary: 'Update Latest Quote' })
  @ApiOkResponse({ type: QuoteRes })
  async updateLatestQuote(
    @Body() data: UpdateLatestQuoteDto,
    @Param('quoteId') quoteId: string,
  ): Promise<ServiceResponse<QuoteDto>> {
    const res = await this.quoteService.updateLatestQuote(data, quoteId);
    return ServiceResponse.fromResult(res);
  }

  @Post('/calculations')
  @ApiOperation({ summary: 'Calculate Quote Detail' })
  @ApiOkResponse({ type: QuoteRes })
  async calculateQuoteDetails(@Body() data: CalculateQuoteDetailDto): Promise<ServiceResponse<QuoteDto>> {
    const res = await this.quoteService.calculateQuoteDetail(data);
    return ServiceResponse.fromResult(res);
  }

  @Get('/discounts')
  @ApiOperation({ summary: 'Get Active Discounts' })
  @ApiOkResponse({ type: DiscountListRes })
  async getDiscounts(): Promise<ServiceResponse<Pagination<DiscountsDto>>> {
    const res = await this.quoteService.getDiscounts();
    return ServiceResponse.fromResult(res);
  }

  @Post('/clone/:quoteId')
  @ApiOperation({ summary: 'Clone quote' })
  @ApiOkResponse({ type: QuoteRes })
  @CheckOpportunity()
  async cloneQuote(@Param('quoteId', ParseObjectIdPipe) quoteId: ObjectId): Promise<ServiceResponse<QuoteDto>> {
    const res = await this.quoteService.cloneQuote(quoteId);
    return ServiceResponse.fromResult(res);
  }

  @Delete('/:quoteId')
  @ApiOperation({ summary: 'Delete quote' })
  async deleteQuote(@Param('quoteId', ParseObjectIdPipe) quoteId: ObjectId): Promise<void> {
    await this.quoteService.deleteQuote(quoteId);
  }
}

import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { Pagination, ServiceResponse } from 'src/app/common';
import { CheckOpportunity } from 'src/app/opportunity.pipe';
import { PreAuthenticate } from 'src/app/securities';
import { STATUS_QUERY } from 'src/contracts/constants';
import { UseAsyncContext } from 'src/shared/async-context/decorators';
import { ParseObjectIdPipe } from 'src/shared/pipes/parse-objectid.pipe';
import { UseSaveQuoteIdToReq } from './interceptors';
import { ValidateQuoteDiscountPipe, ValidateQuotePromotionsPipe, ValidateQuoteRebatesPipe } from './pipes';
import { QuoteService } from './quote.service';
import {
  CalculateQuoteDetailDto,
  CreateQuoteDto,
  LeaseQuoteValidationDto,
  ReQuoteDto,
  UpdateLatestQuoteDto,
  UpdateQuoteDto,
} from './req';
import { QuoteDto, QuoteListRes, QuoteRes } from './res';

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
  @ApiQuery({ name: 'status', required: false })
  async getListQuotes(
    @Query('limit') limit: string,
    @Query('skip') skip: string,
    @Query('isSync') isSync: string,
    @Query('systemDesignId') systemDesignId: string,
    @Query('opportunityId') opportunityId: string,
    @Query('status') status: STATUS_QUERY,
  ): Promise<ServiceResponse<Pagination<QuoteDto>>> {
    const res = await this.quoteService.getAllQuotes(
      Number(limit || 100),
      Number(skip || 0),
      systemDesignId,
      opportunityId,
      status || STATUS_QUERY.ACTIVE,
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
  @UseSaveQuoteIdToReq('quoteId', 'body')
  async updateQuote(
    @Body(ValidateQuoteDiscountPipe, ValidateQuotePromotionsPipe, ValidateQuoteRebatesPipe) data: UpdateQuoteDto,
    @Param('quoteId', ParseObjectIdPipe) quoteId: ObjectId,
  ): Promise<ServiceResponse<QuoteDto>> {
    const res = await this.quoteService.updateQuote(quoteId, data);
    return ServiceResponse.fromResult(res);
  }

  @UseAsyncContext
  @Put('/:quoteId/latest')
  @ApiOperation({ summary: 'Update Latest Quote' })
  @ApiOkResponse({ type: QuoteRes })
  @UseSaveQuoteIdToReq('quoteId', 'body')
  async updateLatestQuote(
    @Body(ValidateQuoteDiscountPipe, ValidateQuotePromotionsPipe, ValidateQuoteRebatesPipe) data: UpdateLatestQuoteDto,
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

  @UseAsyncContext
  @Post('/requote/:quoteId')
  @ApiOperation({ summary: 'Re-quote' })
  @ApiOkResponse({ type: QuoteRes })
  @CheckOpportunity()
  async reQuote(
    @Param('quoteId', ParseObjectIdPipe) quoteId: ObjectId,
    @Body() req: ReQuoteDto,
  ): Promise<ServiceResponse<QuoteDto>> {
    const res = await this.quoteService.reQuote(quoteId, req.systemDesignId);
    return ServiceResponse.fromResult(res);
  }

  @Delete('/:quoteId')
  @ApiOperation({ summary: 'Delete quote' })
  async deleteQuote(@Param('quoteId', ParseObjectIdPipe) quoteId: ObjectId): Promise<void> {
    await this.quoteService.deleteQuote(quoteId);
  }
}

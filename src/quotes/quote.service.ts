import { toSnakeCase } from './../utils/transformProperties';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult } from './../app/common/operation-result';
import { Quote, QUOTE } from './quote.schema';
import { CreateQuoteDto } from './req/create-quote.dto';
import { QuoteDto } from './res/quote.dto';

@Injectable()
export class QuoteService {
  constructor(@InjectModel(QUOTE) private readonly quoteModel: Model<Quote>) {}

  async createQuote(data: CreateQuoteDto): Promise<OperationResult<QuoteDto>> {
    const quote = new this.quoteModel(toSnakeCase(data));
    quote.quote_model_type = 'detailed';
    return null;
  }
}

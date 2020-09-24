import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult } from './../app/common';
import { Quote, QUOTE, QuoteModel } from './quote.schema';
import { CreateQuoteDto } from './req/create-quote.dto';
import { QuoteDto } from './res/quote.dto';

@Injectable()
export class QuoteService {
  constructor(@InjectModel(QUOTE) private readonly quoteModel: Model<Quote>) {}

  async createQuote(data: CreateQuoteDto): Promise<OperationResult<QuoteDto>> {
    const quote = new QuoteModel(data);

    const createdQuote = new this.quoteModel(quote);
    await createdQuote.save();

    return OperationResult.ok(new QuoteDto(createdQuote.toObject()));
  }
}

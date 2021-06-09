import { ApiProperty } from '@nestjs/swagger';
import { IDetailedQuoteSchema } from 'src/quotes/quote.schema';

export class QuoteDetailResDto {
  @ApiProperty()
  quoteDetail: IDetailedQuoteSchema;

  constructor(quoteDetail) {
    this.quoteDetail = quoteDetail;
  }
}

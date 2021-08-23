import { ExposeProp } from 'src/shared/decorators';

export class HasQuoteDto {
  @ExposeProp()
  hasQuote: boolean;
}

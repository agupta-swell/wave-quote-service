import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuoteController } from './quote.controller';
import { QUOTE, QuoteSchema } from './quote.schema';
import { QuoteService } from './quote.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: QUOTE, schema: QuoteSchema, collection: 'v2_quotes' }])],
  controllers: [QuoteController],
  providers: [QuoteService],
  exports: [QuoteService],
})
export class QuoteModule {}
